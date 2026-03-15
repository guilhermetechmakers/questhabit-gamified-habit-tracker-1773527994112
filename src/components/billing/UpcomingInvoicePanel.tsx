import { Card, CardContent } from '@/components/ui/card'
import { Calendar, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatCurrency(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

export interface UpcomingInvoicePanelProps {
  amountDue: number
  currency?: string
  periodEnd: string | null
  /** Optional line items (e.g. proration breakdown) */
  lineItems?: Array<{ amount: number; description?: string }>
  className?: string
}

export function UpcomingInvoicePanel({
  amountDue,
  currency = 'usd',
  periodEnd,
  lineItems,
  className,
}: UpcomingInvoicePanelProps) {
  const hasBreakdown = Array.isArray(lineItems) && lineItems.length > 0

  return (
    <Card
      className={cn(
        'rounded-2xl border-border bg-gradient-to-br from-primary/5 to-secondary/5 shadow-card',
        className
      )}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <Calendar className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Upcoming invoice</p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(amountDue, currency)} on {formatDate(periodEnd)}
            </p>
          </div>
        </div>
        {hasBreakdown && (
          <div className="rounded-xl border border-border bg-card/50 p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" aria-hidden />
              Breakdown
            </p>
            <ul className="space-y-1 text-sm">
              {(lineItems ?? []).map((item, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="text-muted-foreground truncate">
                    {item.description ?? 'Item'}
                  </span>
                  <span className="font-medium text-foreground shrink-0">
                    {formatCurrency(item.amount, currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
