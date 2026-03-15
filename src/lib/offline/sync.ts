/**
 * Sync engine: push local queue to server, pull server state, conflict detection.
 * Uses exponential backoff for retries. Last-write-wins with optional manual merge.
 */

import { supabase } from '@/lib/supabase'
import { offlineStore } from './store'
import type { SyncRecord, SyncConflict, HabitWithLocal } from '@/types/offline'
import type { Habit } from '@/types/habit'

const MAX_RETRIES = 5
const BASE_DELAY_MS = 1000

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error' | 'conflict'

export interface SyncResult {
  success: boolean
  pushed: number
  pulled: boolean
  conflicts: SyncConflict[]
  error?: string
}

/** Build operations array from pending sync records for the batch API */
function buildOperations(records: SyncRecord[]): Array<{ localId: string; action: string; entityType: string; payload: unknown }> {
  const list = Array.isArray(records) ? records : []
  return list.map((r) => ({
    localId: r.localId,
    action: r.action,
    entityType: inferEntityType(r),
    payload: r.payload,
  }))
}

function inferEntityType(r: SyncRecord): string {
  if (r.action === 'history') return 'history'
  if (r.action === 'reminder') return 'reminder'
  return 'habit'
}

/** Push pending sync queue to server via Edge Function */
export async function pushSyncQueue(userId: string): Promise<SyncResult> {
  const pending = await offlineStore.getPendingSyncRecords()
  if (pending.length === 0) {
    const pulled = await pullFromServer(userId)
    return { success: true, pushed: 0, pulled, conflicts: [] }
  }

  const operations = buildOperations(pending)
  let lastError: string | undefined
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke('sync-batch', {
        body: { operations },
      })
      if (error) {
        lastError = error.message
        await delay(BASE_DELAY_MS * Math.pow(2, attempt))
        continue
      }
      const payload = data as {
        results?: Array<{ localId: string; serverId?: string; error?: string }>
        conflicts?: SyncConflict[]
        serverVersion?: number
        lastModified?: string | null
      }
      const results = Array.isArray(payload?.results) ? payload.results : []
      const conflicts = Array.isArray(payload?.conflicts) ? payload.conflicts : []

      for (const res of results) {
        const rec = pending.find((r) => r.localId === res.localId)
        if (!rec) continue
        if (res.error) {
          await offlineStore.updateSyncRecord(rec.localId, {
            status: 'failed',
            lastError: res.error,
            attemptedAt: new Date().toISOString(),
          })
        } else {
          await offlineStore.removeSyncRecord(rec.localId)
        }
      }

      await offlineStore.setSyncMetadata(userId, {
        lastSyncedAt: new Date().toISOString(),
        serverVersion: payload?.serverVersion ?? 0,
        lastModified: payload?.lastModified ?? null,
      })

      for (const c of conflicts) {
        await offlineStore.putConflict(c)
      }

      const pulled = await pullFromServer(userId)
      return {
        success: true,
        pushed: results.length,
        pulled,
        conflicts,
      }
    } catch (e) {
      lastError = (e as Error).message
      await delay(BASE_DELAY_MS * Math.pow(2, attempt))
    }
  }

  return {
    success: false,
    pushed: 0,
    pulled: false,
    conflicts: [],
    error: lastError,
  }
}

/** Pull habits from Supabase and merge into local cache (last-write-wins) */
export async function pullFromServer(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (error) return false
    const serverHabits = (data ?? []) as Habit[]
    const list = Array.isArray(serverHabits) ? serverHabits : []
    const withLocal: HabitWithLocal[] = list.map((h) => ({
      ...h,
      _local: { pendingSync: false },
    }))
    await offlineStore.putHabits(withLocal)
    return true
  } catch {
    return false
  }
}