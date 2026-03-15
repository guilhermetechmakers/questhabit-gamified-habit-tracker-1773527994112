/**
 * Integration layer: bridge between local IndexedDB cache and server (Supabase).
 * Reads from local cache; writes go to cache + sync queue; sync engine pushes when online.
 */

import { offlineDb } from '@/lib/offline/db'
import type { HabitLocal, SyncRecord, HabitHistoryRecord } from '@/types/offline'
import type { Habit, CreateHabitInput } from '@/types/habit'
import type { ScheduleJson } from '@/types/habit'

function generateId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/** Map HabitLocal (cache) to Habit (API shape) for UI. */
export function habitLocalToHabit(local: HabitLocal): Habit {
  const { _local, ...rest } = local
  return rest as unknown as Habit
}

/**
 * Get habits from local cache. Returns array; safe for null/undefined.
 */
export async function getHabitsFromCache(userId: string): Promise<Habit[]> {
  const list = await offlineDb.getHabits(userId)
  const items = Array.isArray(list) ? list : []
  return items.map(habitLocalToHabit)
}

/**
 * Get single habit from cache.
 */
export async function getHabitFromCache(id: string): Promise<Habit | null> {
  const local = await offlineDb.getHabit(id)
  if (!local) return null
  return habitLocalToHabit(local)
}

/**
 * Write habit to cache and enqueue sync (create or update).
 */
export async function upsertHabitToCacheAndQueue(
  userId: string,
  habit: HabitLocal | (CreateHabitInput & { id?: string }),
  action: 'create' | 'update'
): Promise<HabitLocal> {
  const id = (habit as { id?: string }).id ?? generateId()
  const now = new Date().toISOString()
  const local: HabitLocal = {
    id,
    user_id: userId,
    title: (habit as { title: string }).title,
    description: (habit as { description?: string }).description ?? null,
    icon: (habit as { icon?: string }).icon ?? 'target',
    goal: (habit as { goal?: string }).goal ?? null,
    schedule_json: ((habit as { schedule_json?: ScheduleJson }).schedule_json ?? { frequency: 'daily' }) as ScheduleJson,
    xp_value: (habit as { xp_value?: number }).xp_value ?? 10,
    privacy_flag: (habit as { privacy_flag?: 'private' | 'friends' | 'public' }).privacy_flag ?? 'private',
    archived: (habit as { archived?: boolean }).archived ?? false,
    timezone: (habit as { timezone?: string }).timezone ?? null,
    created_at: (habit as { created_at?: string }).created_at ?? now,
    updated_at: (habit as { updated_at?: string }).updated_at ?? now,
    _local: {
      pendingSync: true,
      syncId: `sync-${id}-${Date.now()}`,
      draft: false,
      conflict: false,
    },
  }

  await offlineDb.putHabit(local)

  const syncRecord: SyncRecord = {
    localId: local._local!.syncId!,
    action: action === 'create' ? 'create' : 'update',
    payload: { habit: local },
    status: 'pending',
    createdAt: now,
  }
  await offlineDb.putSyncRecord(syncRecord)

  return local
}

/**
 * Mark habit as deleted in cache and enqueue delete sync.
 */
export async function deleteHabitFromCacheAndQueue(id: string, habit: HabitLocal): Promise<void> {
  const syncId = `sync-delete-${id}-${Date.now()}`
  const syncRecord: SyncRecord = {
    localId: syncId,
    action: 'delete',
    payload: { habit },
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  await offlineDb.putSyncRecord(syncRecord)
  await offlineDb.deleteHabit(id)
}

/**
 * Add completion to local history and enqueue history sync.
 */
export async function addCompletionToCacheAndQueue(
  userId: string,
  habitId: string,
  xpDelta: number,
  completionId?: string
): Promise<HabitHistoryRecord> {
  const id = completionId ?? generateId()
  const now = new Date().toISOString()
  const entry: HabitHistoryRecord = {
    id,
    habitId,
    timestamp: now,
    action: 'complete',
    xpDelta,
    source: 'offline_sync',
  }
  await offlineDb.putHistoryEntry(entry)

  const syncRecord: SyncRecord = {
    localId: `history-${id}`,
    action: 'history',
    payload: {
      history: {
        id,
        habit_id: habitId,
        user_id: userId,
        timestamp: now,
        action: 'complete',
        xp_delta: xpDelta,
        source: 'offline_sync',
      },
    },
    status: 'pending',
    createdAt: now,
  }
  await offlineDb.putSyncRecord(syncRecord)

  return entry
}

/**
 * Hydrate local cache from server habits (e.g. after login or when coming online).
 */
export async function hydrateHabitsFromServer(habits: Habit[]): Promise<void> {
  const list = Array.isArray(habits) ? habits : []
  const locals: HabitLocal[] = list.map((h) => ({
    ...h,
    _local: { pendingSync: false, conflict: false },
  }))
  await offlineDb.putHabits(locals)
}
