/**
 * Conflict resolution: show unresolved conflicts and allow last-write-wins or dismiss.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useOfflineSync } from '@/contexts/offline-sync-context'
import { AlertTriangle } from 'lucide-react'

export function ConflictResolutionModal() {
  const { conflicts, resolveConflict, triggerSync } = useOfflineSync()
  const list = Array.isArray(conflicts) ? conflicts : []
  const unresolved = list.filter((c) => !c?.resolved)
  const open = unresolved.length > 0

  const handleUseOurs = async (id: string) => {
    await resolveConflict(id)
  }

  const handleRetrySync = () => {
    triggerSync()
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="rounded-2xl border-border bg-card"
        aria-describedby="conflict-desc"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-5 w-5 text-secondary" aria-hidden />
            Sync conflict
          </DialogTitle>
          <DialogDescription id="conflict-desc">
            Some changes could not be merged automatically. You can keep your version and retry
            sync, or resolve later.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 py-2">
          {unresolved.slice(0, 5).map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
            >
              <span className="text-foreground">
                {c.entityType}: {c.entityId.slice(0, 8)}…
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => handleUseOurs(c.id)}
                aria-label={`Resolve conflict for ${c.entityType}`}
              >
                Keep mine
              </Button>
            </li>
          ))}
        </ul>
        {unresolved.length > 5 && (
          <p className="text-xs text-muted-foreground">
            +{unresolved.length - 5} more. Resolve from list or retry sync.
          </p>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleRetrySync} className="rounded-xl">
            Retry sync
          </Button>
          <Button variant="gradient" className="rounded-xl" onClick={() => unresolved.forEach((c) => resolveConflict(c.id))}>
            Dismiss all
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
