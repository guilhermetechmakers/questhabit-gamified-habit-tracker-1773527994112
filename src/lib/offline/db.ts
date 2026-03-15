/**
 * IndexedDB layer for offline-first habit data.
 * Stores habits, habit_history, reminders, sync_queue, conflicts, sync_metadata, and activityLog.
 */

import { openDB, type IDBPDatabase } from 'idb'
import type { HabitLocal, HabitHistoryRecord, ReminderLocal, SyncRecord, ConflictRecord, SyncMetadata, ActivityItem } from '@/types/offline'

const DB_NAME = 'questhabit-offline'
const DB_VERSION = 2

type OfflineDBSchema = {
  habits: { key: string; value: HabitLocal; indexes: { 'by-user': string } }
  habit_history: { key: string; value: HabitHistoryRecord; indexes: { 'by-habit': string; 'by-habit-date': string } }
  reminders: { key: string; value: ReminderLocal; indexes: { 'by-habit': string } }
  sync_queue: { key: string; value: SyncRecord; indexes: { 'by-status': string } }
  conflicts: { key: string; value: ConflictRecord; indexes: { 'resolved': number } }
  sync_metadata: { key: string; value: SyncMetadata }
  activityLog: { key: string; value: ActivityItem; indexes: { 'by-timestamp': string } }
}

export type OfflineDB = IDBPDatabase<OfflineDBSchema>

let dbPromise: Promise<IDBPDatabase<OfflineDBSchema>> | null = null

function getDB(): Promise<OfflineDB> {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, _oldVersion, newVersion) {
        if (!db.objectStoreNames.contains('habits')) {
          const habitsStore = db.createObjectStore('habits', { keyPath: 'id' })
          habitsStore.createIndex('by-user', 'user_id')
        }
        if (!db.objectStoreNames.contains('habit_history')) {
          const historyStore = db.createObjectStore('habit_history', { keyPath: 'id' })
          historyStore.createIndex('by-habit', 'habitId')
          historyStore.createIndex('by-habit-date', ['habitId', 'timestamp'])
        }
        if (!db.objectStoreNames.contains('reminders')) {
          const remindersStore = db.createObjectStore('reminders', { keyPath: 'id' })
          remindersStore.createIndex('by-habit', 'habitId')
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'localId' })
          syncStore.createIndex('by-status', 'status')
        }
        if (!db.objectStoreNames.contains('conflicts')) {
          const conflictsStore = db.createObjectStore('conflicts', { keyPath: 'id' })
          conflictsStore.createIndex('resolved', 'resolved')
        }
        if (!db.objectStoreNames.contains('sync_metadata')) {
          db.createObjectStore('sync_metadata', { keyPath: 'userId' })
        }
        if ((newVersion ?? 0) >= 2 && !db.objectStoreNames.contains('activityLog')) {
          const activityStore = db.createObjectStore('activityLog', { keyPath: 'id' })
          activityStore.createIndex('by-timestamp', 'timestamp')
        }
      },
    })
  }
  return dbPromise as Promise<OfflineDB>
}

export const offlineDb = {
  async getDb(): Promise<OfflineDB> {
    return getDB()
  },

  // Habits
  async getHabits(userId: string): Promise<HabitLocal[]> {
    const db = await getDB()
    const all = await db.getAllFromIndex('habits', 'by-user', userId)
    return Array.isArray(all) ? all : []
  },

  async getHabit(id: string): Promise<HabitLocal | undefined> {
    const db = await getDB()
    return db.get('habits', id)
  },

  async putHabit(habit: HabitLocal): Promise<void> {
    const db = await getDB()
    await db.put('habits', habit)
  },

  async putHabits(habits: HabitLocal[]): Promise<void> {
    const db = await getDB()
    const tx = db.transaction('habits', 'readwrite')
    await Promise.all((habits ?? []).map((h) => tx.store.put(h)))
    await tx.done
  },

  async deleteHabit(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('habits', id)
  },

  // Habit history (completions)
  async getHistory(habitId: string, limit?: number): Promise<HabitHistoryRecord[]> {
    const db = await getDB()
    let list = await db.getAllFromIndex('habit_history', 'by-habit', habitId)
    if (!Array.isArray(list)) list = []
    list.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))
    if (limit != null) list = list.slice(0, limit)
    return list
  },

  async putHistoryEntry(entry: HabitHistoryRecord): Promise<void> {
    const db = await getDB()
    await db.put('habit_history', entry)
  },

  async putHistoryEntries(entries: HabitHistoryRecord[]): Promise<void> {
    const db = await getDB()
    const tx = db.transaction('habit_history', 'readwrite')
    await Promise.all((entries ?? []).map((e) => tx.store.put(e)))
    await tx.done
  },

  // Reminders
  async getReminders(habitId: string): Promise<ReminderLocal[]> {
    const db = await getDB()
    const list = await db.getAllFromIndex('reminders', 'by-habit', habitId)
    return Array.isArray(list) ? list : []
  },

  async putReminder(reminder: ReminderLocal): Promise<void> {
    const db = await getDB()
    await db.put('reminders', reminder)
  },

  async deleteReminder(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('reminders', id)
  },

  // Sync queue
  async getPendingSyncRecords(): Promise<SyncRecord[]> {
    const db = await getDB()
    const list = await db.getAllFromIndex('sync_queue', 'by-status', 'pending')
    return Array.isArray(list) ? list : []
  },

  async putSyncRecord(record: SyncRecord): Promise<void> {
    const db = await getDB()
    await db.put('sync_queue', { ...record, localId: record.localId })
  },

  async updateSyncRecordStatus(localId: string, status: SyncRecord['status'], lastError?: string): Promise<void> {
    const db = await getDB()
    const existing = await db.get('sync_queue', localId)
    if (existing) {
      await db.put('sync_queue', {
        ...existing,
        status,
        lastError: lastError ?? existing.lastError,
        attemptedAt: new Date().toISOString(),
      })
    }
  },

  async deleteSyncRecord(localId: string): Promise<void> {
    const db = await getDB()
    await db.delete('sync_queue', localId)
  },

  async getSyncQueueLength(): Promise<number> {
    const pending = await this.getPendingSyncRecords()
    return (pending ?? []).length
  },

  // Conflicts
  async getUnresolvedConflicts(): Promise<ConflictRecord[]> {
    const db = await getDB()
    const all = await db.getAll('conflicts')
    const list = Array.isArray(all) ? all : []
    return list.filter((c) => !c?.resolved) as ConflictRecord[]
  },

  async putConflict(conflict: ConflictRecord): Promise<void> {
    const db = await getDB()
    await db.put('conflicts', conflict)
  },

  async getConflict(id: string): Promise<ConflictRecord | undefined> {
    const db = await getDB()
    return db.get('conflicts', id)
  },

  async resolveConflict(id: string, mergePayload?: unknown): Promise<void> {
    const db = await getDB()
    const c = await db.get('conflicts', id)
    if (c) {
      await db.put('conflicts', { ...c, resolved: true, resolvedAt: new Date().toISOString(), mergePayload })
    }
  },

  // Sync metadata (per user)
  async getSyncMetadata(userId: string): Promise<SyncMetadata | undefined> {
    const db = await getDB()
    return db.get('sync_metadata', userId)
  },

  async setSyncMetadata(userId: string, meta: SyncMetadata): Promise<void> {
    const db = await getDB()
    await db.put('sync_metadata', { ...meta, userId } as SyncMetadata & { userId: string })
  },

  async getActivityLog(limit: number): Promise<ActivityItem[]> {
    const db = await getDB()
    const all = await db.getAllFromIndex('activityLog', 'by-timestamp')
    const list = Array.isArray(all) ? all : []
    const sorted = [...list].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    return sorted.slice(0, limit) as ActivityItem[]
  },

  async addActivity(item: ActivityItem): Promise<void> {
    const db = await getDB()
    await db.put('activityLog', item)
  },
}
