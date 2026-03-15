/**
 * Local cache store: read/write habits, history, reminders, sync queue, conflicts.
 * Uses offlineDb. All array access guarded for null/undefined.
 */

import { offlineDb } from './db'
import type { HabitWithLocal, HabitLocal, SyncRecord, SyncConflict, SyncMetadata, ActivityItem } from '@/types/offline'
import type { HabitHistoryEntry, Reminder } from '@/types/habit'

function mapHistoryRecordToEntry(r: { id: string; habitId: string; timestamp: string; xpDelta: number }): HabitHistoryEntry {
  return {
    id: r.id,
    habit_id: r.habitId,
    date: r.timestamp.slice(0, 10),
    completed: true,
    xp_gained: r.xpDelta,
  }
}

function mapReminderLocalToReminder(r: { id: string; habitId: string; timeOfDay: string; recurrence?: string; enabled: boolean }): Reminder {
  return {
    id: r.id,
    habit_id: r.habitId,
    time_of_day: r.timeOfDay,
    repeats: r.recurrence,
    enabled: r.enabled,
  }
}

export const offlineStore = {
  async getHabits(userId: string): Promise<HabitWithLocal[]> {
    const list = await offlineDb.getHabits(userId)
    return (Array.isArray(list) ? list : []) as HabitWithLocal[]
  },

  async getHabit(id: string): Promise<HabitWithLocal | undefined> {
    return offlineDb.getHabit(id) as Promise<HabitWithLocal | undefined>
  },

  async putHabit(habit: HabitWithLocal): Promise<void> {
    await offlineDb.putHabit(habit as Parameters<typeof offlineDb.putHabit>[0])
  },

  async putHabits(habits: HabitWithLocal[]): Promise<void> {
    const list = Array.isArray(habits) ? habits : []
    await offlineDb.putHabits(list as unknown as HabitLocal[])
  },

  async deleteHabit(id: string): Promise<void> {
    await offlineDb.deleteHabit(id)
  },

  async getHistory(habitId: string): Promise<HabitHistoryEntry[]> {
    const list = await offlineDb.getHistory(habitId)
    return (Array.isArray(list) ? list : []).map(mapHistoryRecordToEntry)
  },

  async putHistoryEntry(entry: HabitHistoryEntry): Promise<void> {
    await offlineDb.putHistoryEntry({
      id: entry.id,
      habitId: entry.habit_id,
      timestamp: entry.date + 'T12:00:00Z',
      action: 'complete',
      xpDelta: entry.xp_gained ?? 0,
    })
  },

  async getReminders(habitId: string): Promise<Reminder[]> {
    const list = await offlineDb.getReminders(habitId)
    return (Array.isArray(list) ? list : []).map(mapReminderLocalToReminder)
  },

  async putReminder(reminder: Reminder): Promise<void> {
    await offlineDb.putReminder({
      id: reminder.id,
      habitId: reminder.habit_id,
      timeOfDay: reminder.time_of_day,
      recurrence: reminder.repeats,
      enabled: reminder.enabled,
    })
  },

  async getSyncQueue(): Promise<SyncRecord[]> {
    return offlineDb.getPendingSyncRecords()
  },

  async getPendingSyncRecords(): Promise<SyncRecord[]> {
    const list = await offlineDb.getPendingSyncRecords()
    return Array.isArray(list) ? list : []
  },

  async addSyncRecord(record: SyncRecord): Promise<void> {
    await offlineDb.putSyncRecord(record)
  },

  async updateSyncRecord(localId: string, updates: Partial<SyncRecord>): Promise<void> {
    await offlineDb.updateSyncRecordStatus(localId, updates.status ?? 'pending', updates.lastError)
  },

  async removeSyncRecord(localId: string): Promise<void> {
    await offlineDb.deleteSyncRecord(localId)
  },

  async getConflicts(): Promise<SyncConflict[]> {
    const list = await offlineDb.getUnresolvedConflicts()
    return (Array.isArray(list) ? list : []) as SyncConflict[]
  },

  async putConflict(conflict: SyncConflict): Promise<void> {
    await offlineDb.putConflict(conflict as Parameters<typeof offlineDb.putConflict>[0])
  },

  async resolveConflict(id: string): Promise<void> {
    await offlineDb.resolveConflict(id)
  },

  async getSyncMetadata(userId: string): Promise<SyncMetadata | null> {
    const meta = await offlineDb.getSyncMetadata(userId)
    return meta ?? null
  },

  async setSyncMetadata(userId: string, meta: SyncMetadata): Promise<void> {
    await offlineDb.setSyncMetadata(userId, meta)
  },

  async getActivityLog(limit: number): Promise<ActivityItem[]> {
    const list = await offlineDb.getActivityLog(limit)
    return Array.isArray(list) ? list : []
  },

  async addActivity(item: ActivityItem): Promise<void> {
    await offlineDb.addActivity(item)
  },
}
