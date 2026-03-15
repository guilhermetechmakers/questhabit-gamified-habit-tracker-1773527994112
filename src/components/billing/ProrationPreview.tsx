import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProrationPreview as ProrationPreviewType } from '@/types/payments'

function formatCurrency(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

export interface ProrationPreviewProps {
  /** Preview data when changing to a new plan; null when loading or not applicable */
  preview: ProrationPreviewType | null
  isLoading?: boolean
  planName?: string
  className?: string
}

export function ProrationPreview({
  preview,
  isLoading,
  planName,
  className,
}: ProrationPreviewProps) {
  if (isLoading) {
    return (
      <Card className={cn('rounded-2xl border-border border-primary/20 bg-primary/5', className)}>
        <CardContent className="p-4">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!preview || preview.amount_due === 0) {
    return null
  }

  return (
    <Card
      className={cn(
        'rounded-2xl border-border border-primary/20 bg-primary/5 shadow-card animate-fade-in',
        className
      )}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
          <p className="text-sm font-medium">
            {planName ? `Estimated cost for ${planName}` : 'Proration preview'}
          </p>
        </div>
        <p className="text-lg font-bold text-foreground">
          {formatCurrency(preview.amount_due, preview.currency)}
        </p>
        {Array.isArray(preview.line_items) && preview.line_items.length > 0 && (
          <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
            {preview.line_items.map((item, i) => (
              <li key={i}>
                {item.description ?? 'Proration'}: {formatCurrency(item.amount, preview.currency)}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
