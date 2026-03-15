/**
 * Sync status indicator: offline, syncing, synced, conflict, error.
 * Uses QuestHabit design tokens (primary orange, secondary purple).
 */

import { useOfflineSync } from '@/contexts/offline-sync-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CloudOff, RefreshCw, AlertTriangle, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function SyncStatusChip() {
  const { syncStatus, lastSyncedAt, pendingCount, isOnline, triggerSync } = useOfflineSync()
  const isSyncing = syncStatus === 'syncing'

  const label =
    syncStatus === 'offline'
      ? 'Offline'
      : syncStatus === 'syncing'
        ? 'Syncing…'
        : syncStatus === 'conflict'
          ? 'Conflict'
          : syncStatus === 'error'
            ? 'Sync failed'
            : lastSyncedAt
              ? `Synced ${formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}`
              : 'Synced'

  const icon =
    !isOnline ? (
      <CloudOff className="h-4 w-4 shrink-0" aria-hidden />
    ) : syncStatus === 'syncing' ? (
      <RefreshCw className="h-4 w-4 shrink-0 animate-[spin_1s_linear_infinite]" aria-hidden />
    ) : syncStatus === 'conflict' || syncStatus === 'error' ? (
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
    ) : (
      <Check className="h-4 w-4 shrink-0" aria-hidden />
    )

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm',
        'border-border bg-card/80 backdrop-blur-sm',
        syncStatus === 'offline' && 'text-muted-foreground',
        syncStatus === 'conflict' && 'border-secondary/50 text-secondary',
        syncStatus === 'error' && 'border-destructive/50 text-destructive'
      )}
      role="status"
      aria-live="polite"
      aria-label={`Sync: ${label}${pendingCount > 0 ? `, ${pendingCount} pending` : ''}`}
    >
      {icon}
      <span className="truncate">{label}</span>
      {pendingCount > 0 && !isSyncing && (
        <span className="text-muted-foreground">({pendingCount})</span>
      )}
      {isOnline && syncStatus !== 'syncing' && (syncStatus === 'error' || pendingCount > 0) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 rounded-lg px-2 text-xs"
          onClick={() => triggerSync()}
          disabled={isSyncing}
          aria-label="Retry sync"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
