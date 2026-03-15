/**
 * Offline sync & local cache types.
 * Aligns with backend habits/completions/reminders; adds _local and sync entities.
 */

import type { Habit } from '@/types/habit'
import type { ScheduleJson } from '@/types/habit'

export type HabitType = 'active' | 'archived' | 'template'

export interface LocalMeta {
  draft?: boolean
  pendingSync?: boolean
  syncId?: string
  conflict?: boolean
  createdAt?: string
  updatedAt?: string
}

/** Habit as stored in local cache; may have client-only id before first sync. */
export interface HabitLocal extends Omit<Habit, 'id'> {
  id: string
  _local?: LocalMeta
}

/** Habit with optional local sync metadata (alias for UI). */
export type HabitWithLocal = Habit & { _local?: LocalMeta }

/** Conflict record (alias for ConflictRecord). */
export type SyncConflict = ConflictRecord

export type HistoryAction = 'complete' | 'skip'

export interface HabitHistoryRecord {
  id: string
  habitId: string
  timestamp: string
  action: HistoryAction
  xpDelta: number
  source?: string
}

export interface ReminderLocal {
  id: string
  habitId: string
  timeOfDay: string
  recurrence?: string
  enabled: boolean
  createdAt?: string
  updatedAt?: string
}

export type SyncAction = 'create' | 'update' | 'delete' | 'history' | 'reminder'

export type SyncRecordStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export interface SyncRecord {
  localId: string
  serverId?: string
  action: SyncAction
  payload: unknown
  status: SyncRecordStatus
  attemptedAt?: string
  lastError?: string
  createdAt: string
}

export interface ConflictRecord {
  id: string
  entityType: 'habit' | 'history' | 'reminder'
  entityId: string
  localVersion: number
  serverVersion: number
  localPayload?: unknown
  serverPayload?: unknown
  mergePayload?: unknown
  resolved: boolean
  resolvedAt?: string
  createdAt: string
}

export interface SyncMetadata {
  id?: string
  userId?: string
  lastSyncedAt?: string | null
  serverVersion: number
  lastModified: string | null
  habitsUpdatedAt?: string
}

/** Activity timeline item for dashboard. */
export type ActivityItemType = 'completion' | 'reminder' | 'xp' | 'conflict_resolved'

export interface ActivityItem {
  id: string
  type: ActivityItemType
  habitId?: string
  habitTitle?: string
  timestamp: string
  payload?: { xp?: number; message?: string }
}

export interface ScheduleObject {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  interval?: number
  days?: number[]
  times?: string[]
  timezone?: string
}

/** Shape expected by sync API for habit upsert (snake_case for server). */
export interface HabitSyncPayload {
  id?: string
  user_id: string
  title: string
  description?: string | null
  icon?: string
  goal?: string | null
  schedule_json: ScheduleJson
  xp_value: number
  privacy_flag: string
  archived: boolean
  timezone?: string | null
  updated_at?: string
}

/** Shape for history entry in sync batch. */
export interface HistorySyncPayload {
  id?: string
  habit_id: string
  user_id: string
  timestamp: string
  action: 'complete' | 'skip'
  xp_delta: number
  source?: string
}
