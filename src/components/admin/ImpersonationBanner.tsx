import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

export interface ImpersonationBannerProps {
  impersonatedUserName?: string | null
  onStop: () => void
  isStopping?: boolean
  className?: string
}

export function ImpersonationBanner({
  impersonatedUserName,
  onStop,
  isStopping = false,
  className,
}: ImpersonationBannerProps) {
  return (
    <div
      role="banner"
      aria-label="Impersonation mode active"
      className={cn(
        'flex items-center justify-between gap-4 rounded-xl border-2 border-primary/50 bg-primary/10 px-4 py-3 text-foreground',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        <span className="text-sm font-medium">
          Viewing as {impersonatedUserName ?? 'another user'}. Actions are limited and audited.
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onStop}
        disabled={isStopping}
        aria-label="Stop impersonation"
        className="shrink-0"
      >
        {isStopping ? 'Stopping…' : 'Stop'}
      </Button>
    </div>
  )
}
