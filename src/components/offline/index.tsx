/**
 * Offline/sync UI: status chip and conflict modal wired to useSync.
 */

import { useState, useEffect } from 'react'
import { useSyncOptional } from '@/contexts/sync-context'
import { SyncStatusChip as SyncStatusChipBase } from '@/components/sync/SyncStatusChip'
import { ConflictResolutionModal as ConflictResolutionModalBase } from '@/components/sync/ConflictResolutionModal'

export function SyncStatusChip() {
  const sync = useSyncOptional()
  if (!sync) return null
  return (
    <SyncStatusChipBase
      status={sync.status}
      lastSyncTime={sync.lastSyncTime}
      pendingCount={sync.pendingCount}
      hasConflicts={sync.conflicts.length > 0}
      onRetry={sync.retrySync}
      showLabel
    />
  )
}

export function ConflictResolutionModal() {
  const sync = useSyncOptional()
  const [open, setOpen] = useState(false)
  const conflict = sync?.conflicts?.[0] ?? null

  useEffect(() => {
    if (Array.isArray(sync?.conflicts) && sync.conflicts.length > 0) {
      setOpen(true)
    }
  }, [sync?.conflicts?.length])

  if (!sync) return null
  return (
    <ConflictResolutionModalBase
      conflict={conflict}
      open={open}
      onOpenChange={setOpen}
      onResolveLocal={sync.resolveConflictLocal}
      onResolveServer={sync.resolveConflictServer}
    />
  )
}
