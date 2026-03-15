/**
 * Sync engine: pushes local changes to server, pulls metadata, resolves conflicts (last-write-wins).
 * Runs in main thread; use on online event and interval.
 */

import { offlineDb } from '@/lib/offline/db'
import { syncApi } from '@/api/sync'
import type { SyncRecord, ConflictRecord, HabitLocal } from '@/types/offline'
import type { Habit } from '@/types/habit'

const MAX_RETRIES = 5
const INITIAL_BACKOFF_MS = 1000

function backoffDelay(attempt: number): number {
  return INITIAL_BACKOFF_MS * Math.pow(2, Math.min(attempt, 4))
}

function habitToServerRow(h: HabitLocal): Record<string, unknown> {
  return {
    id: h.id,
    user_id: h.user_id,
    title: h.title,
    description: h.description ?? null,
    icon: h.icon ?? 'target',
    goal: h.goal ?? null,
    schedule_json: h.schedule_json ?? { frequency: 'daily' },
    xp_value: h.xp_value ?? 10,
    privacy_flag: h.privacy_flag ?? 'private',
    archived: h.archived ?? false,
    timezone: h.timezone ?? null,
    updated_at: h.updated_at ?? new Date().toISOString(),
  }
}

export type SyncEngineStatus = 'idle' | 'syncing' | 'error'
export type SyncEngineListener = (status: SyncEngineStatus, lastError?: string) => void

let listener: SyncEngineListener | null = null
let status: SyncEngineStatus = 'idle'
let lastError: string | undefined

function notify(s: SyncEngineStatus, err?: string) {
  status = s
  lastError = err
  listener?.(s, err)
}

export function getSyncEngineStatus(): SyncEngineStatus {
  return status
}

export function getSyncEngineLastError(): string | undefined {
  return lastError
}

export function setSyncEngineListener(fn: SyncEngineListener | null): void {
  listener = fn
}

/**
 * Process one sync record and update local state from response.
 */
async function processSyncRecord(
  record: SyncRecord,
  userId: string,
  attempt: number
): Promise<{ success: boolean; conflict?: boolean }> {
  if (record.status !== 'pending' && record.status !== 'failed') return { success: false }

  await offlineDb.updateSyncRecordStatus(record.localId, 'in_progress')

  try {
    const payload = record.payload as { habit?: HabitLocal; history?: unknown; reminder?: unknown }
    const batch: Parameters<typeof syncApi.pushBatch>[0] = {}

    if (record.action === 'create' || record.action === 'update') {
      if (payload.habit) {
        batch.habits = [{ action: record.action as 'create' | 'update', payload: habitToServerRow(payload.habit) }]
      }
    } else if (record.action === 'delete') {
      if (payload.habit && (payload.habit as { id?: string }).id) {
        batch.habits = [{ action: 'delete', payload: { id: (payload.habit as { id: string }).id } }]
      }
    }

    if (!batch.habits && !batch.history && !batch.reminders) {
      await offlineDb.updateSyncRecordStatus(record.localId, 'completed')
      await offlineDb.deleteSyncRecord(record.localId)
      return { success: true }
    }

    const res = await syncApi.pushBatch(batch)
    const conflict = Array.isArray(res.conflicts) && res.conflicts.length > 0
    const habitsResult = res.habits ?? []

    if (habitsResult[0]?.error && !conflict) {
      throw new Error(habitsResult[0].error)
    }
    if (conflict && habitsResult[0]) {
      const c = habitsResult[0]
      await offlineDb.putConflict({
        id: `conflict-${record.localId}-${Date.now()}`,
        entityType: 'habit',
        entityId: (payload.habit as HabitLocal)?.id ?? record.localId,
        localVersion: 1,
        serverVersion: (c as { serverVersion?: number }).serverVersion ?? 0,
        localPayload: payload.habit,
        serverPayload: (c as { serverRow?: Habit }).serverRow,
        resolved: false,
        createdAt: new Date().toISOString(),
      })
      await offlineDb.updateSyncRecordStatus(record.localId, 'failed', 'Conflict detected')
      return { success: false, conflict: true }
    }

    if (habitsResult[0]?.serverId && payload.habit) {
      const updated: HabitLocal = {
        ...(payload.habit as HabitLocal),
        id: habitsResult[0].serverId,
        _local: { ...(payload.habit as HabitLocal)._local, pendingSync: false, syncId: undefined },
      }
      await offlineDb.putHabit(updated)
    }

    await offlineDb.deleteSyncRecord(record.localId)
    return { success: true }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    await offlineDb.updateSyncRecordStatus(record.localId, 'failed', err)
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, backoffDelay(attempt)))
      return processSyncRecord(record, userId, attempt + 1)
    }
    throw e
  }
}

/**
 * Run sync: push all pending records, then optionally refresh metadata.
 */
export async function runSync(userId: string): Promise<{ pushed: number; conflicts: number }> {
  if (status === 'syncing') return { pushed: 0, conflicts: 0 }
  notify('syncing')

  let pushed = 0
  let conflicts = 0

  try {
    const pending = await offlineDb.getPendingSyncRecords()
    const list = Array.isArray(pending) ? pending : []

    for (const record of list) {
      const result = await processSyncRecord(record, userId, 0)
      if (result.success) pushed++
      if (result.conflict) conflicts++
    }

    try {
      const meta = await syncApi.getMetadata()
      if (meta) await offlineDb.setSyncMetadata(userId, meta)
    } catch {
      // Non-fatal
    }

    notify('idle')
    return { pushed, conflicts }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    notify('error', err)
    return { pushed, conflicts }
  }
}

/**
 * Resolve a conflict with last-write-wins (use local or server payload).
 */
export async function resolveConflictLocalWins(conflictId: string): Promise<void> {
  const c = await offlineDb.getConflict(conflictId)
  if (!c) return
  await offlineDb.resolveConflict(conflictId, c.localPayload)
  if (c.entityType === 'habit' && c.localPayload) {
    await offlineDb.putHabit(c.localPayload as HabitLocal)
  }
}

export async function resolveConflictServerWins(conflictId: string): Promise<void> {
  const c = await offlineDb.getConflict(conflictId)
  if (!c) return
  await offlineDb.resolveConflict(conflictId, c.serverPayload)
  if (c.entityType === 'habit' && c.serverPayload) {
    const server = c.serverPayload as Habit
    const local: HabitLocal = {
      ...server,
      _local: { pendingSync: false, conflict: false },
    }
    await offlineDb.putHabit(local)
  }
}

export function createConflictRecord(
  entityType: ConflictRecord['entityType'],
  entityId: string,
  localVersion: number,
  serverVersion: number,
  localPayload?: unknown,
  serverPayload?: unknown
): ConflictRecord {
  return {
    id: `conflict-${entityType}-${entityId}-${Date.now()}`,
    entityType,
    entityId,
    localVersion,
    serverVersion,
    localPayload,
    serverPayload,
    resolved: false,
    createdAt: new Date().toISOString(),
  }
}
