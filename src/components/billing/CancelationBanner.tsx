import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

export interface CancelationBannerProps {
  /** Whether the subscription is set to cancel at period end. */
  cancelAtPeriodEnd: boolean
  /** End date of current period (ISO string). */
  periodEndDate: string | null
  onReactivate?: () => void
  isReactivating?: boolean
  className?: string
}

/**
 * Shown when subscription is set to cancel at period end. Retention messaging and reactivation CTA.
 */
export function CancelationBanner({
  cancelAtPeriodEnd,
  periodEndDate,
  onReactivate,
  isReactivating,
  className,
}: CancelationBannerProps) {
  if (!cancelAtPeriodEnd) return null

  return (
    <Card
      className={cn(
        'rounded-2xl border-destructive/30 bg-destructive/5 transition-shadow',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">Subscription ending</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your subscription will end on {formatDate(periodEndDate)}. You'll keep access until then.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Change your mind? Reactivate to keep your plan and avoid losing features.
            </p>
            {onReactivate && (
              <Button
                type="button"
                variant="gradient"
                size="sm"
                className="mt-3 rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
                onClick={onReactivate}
                disabled={isReactivating}
                aria-label="Reactivate subscription"
              >
                {isReactivating ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Reactivating…
                  </span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" aria-hidden />
                    Reactivate subscription
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
