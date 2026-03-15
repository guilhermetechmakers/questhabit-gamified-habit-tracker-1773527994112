/**
 * Sync status chip: offline / syncing / synced / conflict. Accessible and compact.
 */

import { Cloud, CloudOff, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SyncStatus } from '@/contexts/sync-context'

export interface SyncStatusChipProps {
  status: SyncStatus
  lastSyncTime: string | null
  pendingCount: number
  hasConflicts: boolean
  onRetry?: () => void
  className?: string
  showLabel?: boolean
}

function formatRelative(time: string): string {
  try {
    const d = new Date(time)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffM = Math.floor(diffMs / 60000)
    if (diffM < 1) return 'Just now'
    if (diffM < 60) return `${diffM}m ago`
    const diffH = Math.floor(diffM / 60)
    if (diffH < 24) return `${diffH}h ago`
    const diffD = Math.floor(diffH / 24)
    return `${diffD}d ago`
  } catch {
    return ''
  }
}

export function SyncStatusChip({
  status,
  lastSyncTime,
  pendingCount,
  hasConflicts,
  onRetry,
  className,
  showLabel = true,
}: SyncStatusChipProps) {
  const isSyncing = status === 'syncing'
  const isOffline = status === 'offline'
  const isError = status === 'error'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
        isOffline && 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        isSyncing && 'border-primary/50 bg-primary/10 text-primary',
        isError && 'border-destructive/50 bg-destructive/10 text-destructive',
        hasConflicts && !isError && 'border-secondary/50 bg-secondary/10 text-secondary-foreground',
        !isOffline && !isSyncing && !isError && !hasConflicts && 'border-border bg-muted/50 text-muted-foreground',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={
        isOffline
          ? 'Offline. Changes will sync when back online.'
          : isSyncing
            ? 'Syncing…'
            : hasConflicts
              ? 'Sync conflicts need resolution.'
              : lastSyncTime
                ? `Last synced ${formatRelative(lastSyncTime)}`
                : 'Sync status'
      }
    >
      {isOffline && <CloudOff className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      {isSyncing && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />}
      {isError && <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      {hasConflicts && !isSyncing && !isError && <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      {!isOffline && !isSyncing && !isError && !hasConflicts && <Cloud className="h-3.5 w-3.5 shrink-0" aria-hidden />}

      {showLabel && (
        <span>
          {isOffline && 'Offline'}
          {isSyncing && 'Syncing…'}
          {isError && 'Sync error'}
          {hasConflicts && !isSyncing && !isError && 'Conflicts'}
          {!isOffline && !isSyncing && !isError && !hasConflicts && (lastSyncTime ? formatRelative(lastSyncTime) : 'Synced')}
        </span>
      )}

      {pendingCount > 0 && (
        <span className="rounded-full bg-foreground/15 px-1.5 py-0.5 text-[10px]" aria-label={`${pendingCount} pending`}>
          {pendingCount}
        </span>
      )}

      {(isError || (hasConflicts && !isSyncing)) && onRetry && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 shrink-0 p-0"
          onClick={onRetry}
          aria-label="Retry sync"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
