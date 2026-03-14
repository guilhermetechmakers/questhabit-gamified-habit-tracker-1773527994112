import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInvoices, useInvoice } from '@/hooks/use-payments'
import type { Invoice } from '@/types/payments'
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
import { ArrowLeft, FileText } from 'lucide-react'
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

export default function BillingHistory() {
  const [detailId, setDetailId] = useState<string | null>(null)
  const { data: listData, isLoading } = useInvoices({ limit: 50 })
  const { data: detailInvoice } = useInvoice(detailId)

  const invoices = listData?.invoices ?? []

  return (
    <AnimatedPage>
      <Link
        to="/app/billing/subscription"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Billing
      </Link>
      <h1 className="text-2xl font-bold text-foreground mb-2">Invoice history</h1>
      <p className="text-muted-foreground text-sm mb-6">
        View and download past receipts.
      </p>

      <Card className="rounded-2xl border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <InvoiceListSkeleton rows={8} />
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No invoices yet.</p>
              <Link to="/app/billing/checkout">
                <Button variant="outline" size="sm" className="rounded-xl">
                  Go to checkout
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="space-y-2" role="list">
              {invoices.map((inv) => (
                <li
                  key={inv.id}
                  className={cn(
                    'flex items-center justify-between gap-4 rounded-xl border border-border p-4',
                    'transition-all hover:shadow-card hover:border-primary/30 cursor-pointer'
                  )}
                  onClick={() => setDetailId(inv.id)}
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {formatCurrency((inv as Invoice).amount_paid || (inv as Invoice).amount_due, inv.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(inv.period_start ?? inv.created_at)} – {formatDate(inv.period_end ?? null)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <InvoiceBadge status={inv.status} />
                    <span onClick={(e) => e.stopPropagation()}>
                      <ReceiptDownloadButton invoiceId={inv.id} size="icon" variant="ghost" />
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
                  {formatCurrency((detailInvoice as Invoice).amount_paid || (detailInvoice as Invoice).amount_due, detailInvoice.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <InvoiceBadge status={detailInvoice.status} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Period</span>
                <span>
                  {formatDate(detailInvoice.period_start)} – {formatDate(detailInvoice.period_end)}
                </span>
              </div>
              <ReceiptDownloadButton invoiceId={detailInvoice.id} className="w-full justify-center" />
            </div>
          ) : (
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
          )}
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  )
}
