/**
 * Offline sync context: wraps SyncProvider and exposes useOfflineSync with habits from cache,
 * sync status, trigger sync, and conflict resolution.
 */

import type { ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { SyncProvider, useSync } from '@/contexts/sync-context'
import type { HabitWithLocal } from '@/types/offline'

export function OfflineSyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  return <SyncProvider userId={userId}>{children}</SyncProvider>
}

/** Alias for useSync; returns same shape as before with habits, syncStatus, lastSyncedAt, triggerSync, resolveConflict. */
export function useOfflineSync() {
  const ctx = useSync()
  return {
    habits: (ctx.habits ?? []) as HabitWithLocal[],
    syncStatus: ctx.status === 'syncing' ? 'syncing' : ctx.status === 'offline' ? 'offline' : ctx.status === 'error' ? 'error' : ctx.conflicts.length > 0 ? 'conflict' : 'idle',
    lastSyncedAt: ctx.lastSyncTime,
    pendingCount: ctx.pendingCount,
    conflicts: ctx.conflicts,
    isOnline: ctx.isOnline,
    activityLog: [] as { id: string; type: string; habitId?: string; habitTitle?: string; timestamp: string; payload?: unknown }[],
    refresh: ctx.refresh,
    triggerSync: async () => {
      await ctx.retrySync()
      await ctx.refresh()
      return { success: true, pushed: 0, pulled: true, conflicts: ctx.conflicts }
    },
    resolveConflict: ctx.resolveConflict,
  }
}
