import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useInvoices, useInvoice } from '@/hooks/use-payments'
import { AnimatedPage } from '@/components/AnimatedPage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InvoiceBadge } from '@/components/billing/InvoiceBadge'
import { ReceiptDownloadButton } from '@/components/billing/ReceiptDownloadButton'
import { InvoiceListSkeleton } from '@/components/billing/InvoiceListSkeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, FileText, Receipt, Filter } from 'lucide-react'
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

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'open', label: 'Open' },
  { value: 'draft', label: 'Draft' },
  { value: 'uncollectible', label: 'Uncollectible' },
  { value: 'void', label: 'Void' },
]

function getDateRangePreset(preset: string): { date_from?: string; date_to?: string } {
  const now = new Date()
  const to = now.toISOString().slice(0, 10)
  switch (preset) {
    case '30':
      const d30 = new Date(now)
      d30.setDate(d30.getDate() - 30)
      return { date_from: d30.toISOString().slice(0, 10), date_to: to }
    case '90':
      const d90 = new Date(now)
      d90.setDate(d90.getDate() - 90)
      return { date_from: d90.toISOString().slice(0, 10), date_to: to }
    case '12m':
      const d12 = new Date(now)
      d12.setFullYear(d12.getFullYear() - 1)
      return { date_from: d12.toISOString().slice(0, 10), date_to: to }
    default:
      return {}
  }
}

export default function BillingHistory() {
  const [detailId, setDetailId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [datePreset, setDatePreset] = useState<string>('')

  const filterParams = useMemo(() => {
    const { date_from, date_to } = getDateRangePreset(datePreset)
    return {
      limit: 50,
      offset: 0,
      ...(date_from && { date_from }),
      ...(date_to && { date_to }),
      ...(statusFilter && { status: statusFilter }),
    }
  }, [datePreset, statusFilter])

  const { data: listData, isLoading } = useInvoices(filterParams)
  const { data: detailInvoice } = useInvoice(detailId)

  const invoices = listData?.invoices ?? []
  const hasFilters = !!datePreset || !!statusFilter

  return (
    <AnimatedPage>
      <Link
        to="/app/billing/subscription"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Subscription
      </Link>
      <h1 className="text-2xl font-bold text-foreground mb-2">Order & transaction history</h1>
      <p className="text-muted-foreground text-sm mb-6">
        View and download past invoices and receipts.
      </p>

      <Card className="rounded-2xl border-border shadow-card">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" aria-hidden />
              Invoices
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" aria-hidden />
                Filters
              </span>
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
                className={cn(
                  'h-9 w-[130px] rounded-xl border border-input bg-background px-3 py-1.5 text-sm',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                )}
                aria-label="Date range filter"
              >
                <option value="">All time</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="12m">Last 12 months</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={cn(
                  'h-9 w-[140px] rounded-xl border border-input bg-background px-3 py-1.5 text-sm',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                )}
                aria-label="Status filter"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value || 'all'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <InvoiceListSkeleton rows={8} />
          ) : invoices.length === 0 ? (
            <div
              className="py-12 px-4 text-center rounded-2xl border border-dashed border-border bg-muted/20"
              role="status"
              aria-label="No invoices"
            >
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Receipt className="h-7 w-7" aria-hidden />
                </div>
              </div>
              <p className="font-medium text-foreground mb-1">
                {hasFilters ? 'No invoices match your filters' : 'No invoices yet'}
              </p>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                {hasFilters
                  ? 'Try changing the date range or status filter.'
                  : 'Your subscription invoices and receipts will appear here.'}
              </p>
              {hasFilters ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => {
                    setDatePreset('')
                    setStatusFilter('')
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Link to="/app/billing/checkout">
                  <Button variant="gradient" size="sm" className="rounded-xl">
                    Go to checkout
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <ul className="space-y-2" role="list">
              {(invoices ?? []).map((inv) => (
                <li
                  key={inv.id}
                  className={cn(
                    'flex items-center justify-between gap-4 rounded-xl border border-border p-4',
                    'transition-all duration-200 hover:shadow-card hover:border-primary/30 cursor-pointer'
                  )}
                  onClick={() => setDetailId(inv?.id ?? null)}
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {formatCurrency(
                        (inv?.amount_paid ?? inv?.amount_due ?? 0),
                        inv?.currency ?? 'usd'
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(inv?.period_start ?? inv?.created_at ?? null)} –{' '}
                      {formatDate(inv?.period_end ?? null)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <InvoiceBadge status={inv?.status ?? ''} />
                    <span onClick={(e) => e.stopPropagation()}>
                      <ReceiptDownloadButton invoiceId={inv?.id ?? ''} size="icon" variant="ghost" />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="rounded-2xl border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Invoice details</DialogTitle>
          </DialogHeader>
          {detailInvoice ? (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">
                  {formatCurrency(
                    detailInvoice?.amount_paid ?? detailInvoice?.amount_due ?? 0,
                    detailInvoice?.currency ?? 'usd'
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <InvoiceBadge status={detailInvoice?.status ?? ''} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Period</span>
                <span>
                  {formatDate(detailInvoice?.period_start ?? null)} –{' '}
                  {formatDate(detailInvoice?.period_end ?? null)}
                </span>
              </div>
              <ReceiptDownloadButton
                invoiceId={detailInvoice?.id ?? ''}
                className="w-full justify-center"
              />
            </div>
          ) : (
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
          )}
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  )
}
