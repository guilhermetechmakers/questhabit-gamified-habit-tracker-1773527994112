/**
 * Sync status context: online/offline, last sync time, pending count, conflicts, habits from cache, retry and resolve actions.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  runSync,
  setSyncEngineListener,
  getSyncEngineStatus,
  getSyncEngineLastError,
  offlineDb,
  getHabitsFromCache,
  hydrateHabitsFromServer,
  resolveConflictLocalWins,
  resolveConflictServerWins,
} from '@/lib/offline'
import { habitsApi } from '@/api/habits'
import type { ConflictRecord } from '@/types/offline'
import type { Habit } from '@/types/habit'

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'error'

interface SyncContextValue {
  isOnline: boolean
  status: SyncStatus
  lastSyncTime: string | null
  pendingCount: number
  conflicts: ConflictRecord[]
  habits: Habit[]
  lastError: string | null
  retrySync: () => Promise<void>
  triggerSync: () => Promise<void>
  resolveConflictLocal: (conflictId: string) => Promise<void>
  resolveConflictServer: (conflictId: string) => Promise<void>
  resolveConflict: (conflictId: string) => Promise<void>
  refresh: () => Promise<void>
}

const SyncContext = createContext<SyncContextValue | null>(null)

export function SyncProvider({ children, userId }: { children: ReactNode; userId: string | undefined }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [engineStatus, setEngineStatus] = useState<'idle' | 'syncing' | 'error'>(getSyncEngineStatus())
  const [lastError, setLastError] = useState<string | null>(getSyncEngineLastError() ?? null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([])
  const [habits, setHabits] = useState<Habit[]>([])

  const refresh = useCallback(async () => {
    if (!userId) return
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const serverHabits = await habitsApi.getAllIncludingArchived(userId)
        await hydrateHabitsFromServer(Array.isArray(serverHabits) ? serverHabits : [])
        await runSync(userId)
      } catch {
        // Use cache only when server fails
      }
    }
    const [pending, unresolved, meta, cachedHabits] = await Promise.all([
      offlineDb.getPendingSyncRecords(),
      offlineDb.getUnresolvedConflicts(),
      offlineDb.getSyncMetadata(userId),
      getHabitsFromCache(userId),
    ])
    setPendingCount(Array.isArray(pending) ? pending.length : 0)
    setConflicts(Array.isArray(unresolved) ? unresolved : [])
    setHabits(Array.isArray(cachedHabits) ? cachedHabits : [])
    if (meta?.lastModified) setLastSyncTime(meta.lastModified)
  }, [userId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    setSyncEngineListener((s, err) => {
      setEngineStatus(s)
      setLastError(err ?? null)
    })
    return () => setSyncEngineListener(null)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh, userId])

  const retrySync = useCallback(async () => {
    if (!userId) return
    await runSync(userId)
    await refresh()
  }, [userId, refresh])

  const resolveConflictLocal = useCallback(async (conflictId: string) => {
    await resolveConflictLocalWins(conflictId)
    await refresh()
  }, [refresh])

  const resolveConflictServer = useCallback(async (conflictId: string) => {
    await resolveConflictServerWins(conflictId)
    await refresh()
  }, [refresh])

  const status: SyncStatus = !isOnline
    ? 'offline'
    : engineStatus === 'syncing'
      ? 'syncing'
      : engineStatus === 'error'
        ? 'error'
        : 'online'

  const value: SyncContextValue = {
    isOnline,
    status,
    lastSyncTime,
    pendingCount,
    conflicts,
    habits,
    lastError,
    retrySync,
    triggerSync: retrySync,
    resolveConflictLocal,
    resolveConflictServer,
    resolveConflict: resolveConflictLocal,
    refresh,
  }

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}

export function useSync() {
  const ctx = useContext(SyncContext)
  if (!ctx) throw new Error('useSync must be used within SyncProvider')
  return ctx
}

export function useSyncOptional() {
  return useContext(SyncContext)
}
