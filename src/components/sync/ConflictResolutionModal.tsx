/**
 * Modal to resolve sync conflicts: choose local (keep mine) or server (use theirs).
 */

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import type { ConflictRecord } from '@/types/offline'

export interface ConflictResolutionModalProps {
  conflict: ConflictRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onResolveLocal: (conflictId: string) => Promise<void>
  onResolveServer: (conflictId: string) => Promise<void>
}

export function ConflictResolutionModal({
  conflict,
  open,
  onOpenChange,
  onResolveLocal,
  onResolveServer,
}: ConflictResolutionModalProps) {
  if (!conflict) return null

  const [resolving, setResolving] = React.useState<'local' | 'server' | null>(null)

  const handleLocal = async () => {
    setResolving('local')
    try {
      await onResolveLocal(conflict.id)
      onOpenChange(false)
    } finally {
      setResolving(null)
    }
  }

  const handleServer = async () => {
    setResolving('server')
    try {
      await onResolveServer(conflict.id)
      onOpenChange(false)
    } finally {
      setResolving(null)
    }
  }

  const title =
    conflict.entityType === 'habit'
      ? 'Habit was changed elsewhere'
      : conflict.entityType === 'reminder'
        ? 'Reminder conflict'
        : 'Sync conflict'

  const description =
    conflict.entityType === 'habit'
      ? 'This habit was updated on another device or in another tab. Keep your version or use the server version.'
      : 'Choose which version to keep.'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-border bg-card shadow-card" aria-describedby="conflict-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-primary" aria-hidden />
            {title}
          </DialogTitle>
          <DialogDescription id="conflict-desc">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={handleLocal}
            disabled={resolving !== null}
            aria-label="Keep my version"
          >
            {resolving === 'local' ? 'Applying…' : 'Keep my version'}
          </Button>
          <Button
            variant="default"
            className="rounded-xl"
            onClick={handleServer}
            disabled={resolving !== null}
            aria-label="Use server version"
          >
            {resolving === 'server' ? 'Applying…' : 'Use server version'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
