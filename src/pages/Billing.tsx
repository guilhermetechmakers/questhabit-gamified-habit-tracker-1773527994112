import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useSubscription, useInvoices, useUpcomingInvoice } from '@/hooks/use-payments'
import type { Invoice, UpcomingInvoice } from '@/types/payments'
import { AnimatedPage } from '@/components/AnimatedPage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InvoiceBadge } from '@/components/billing/InvoiceBadge'
import { ReceiptDownloadButton } from '@/components/billing/ReceiptDownloadButton'
import { InvoiceListSkeleton } from '@/components/billing/InvoiceListSkeleton'
import { CreditCard, FileText, Plus, Calendar } from 'lucide-react'
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

export default function Billing() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const { data: subscription, isLoading: subLoading } = useSubscription(userId)
  const { data: invoicesData, isLoading: invoicesLoading } = useInvoices({ limit: 5 })
  const { data: upcoming, isLoading: upcomingLoading } = useUpcomingInvoice(userId)

  const invoices = invoicesData?.invoices ?? []
  const hasSubscription = subscription && ['active', 'trialing'].includes(subscription.status)

  return (
    <AnimatedPage>
      <h1 className="text-2xl font-bold text-foreground mb-6">Billing</h1>

      {/* Subscription status */}
      <Card className="mb-6 bg-card border-border rounded-2xl shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subLoading ? (
            <div className="h-16 animate-pulse rounded-xl bg-muted" />
          ) : hasSubscription ? (
            <>
              <p className="text-sm text-muted-foreground">
                You're on <span className="font-medium text-foreground">{subscription.plan_id}</span>.
                {subscription.cancel_at_period_end && (
                  <span className="block mt-1 text-primary">Cancels at end of billing period.</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                Current period: {formatDate(subscription.current_period_start)} – {formatDate(subscription.current_period_end)}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link to="/app/billing/subscription">
                  <Button variant="outline" size="sm" className="rounded-xl">
                    Manage plan
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">No active subscription.</p>
              <Link to="/app/billing/checkout">
                <Button variant="gradient" size="sm" className="rounded-xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Subscribe
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      {/* Upcoming invoice */}
      {upcomingLoading ? (
        <div className="h-20 animate-pulse rounded-2xl bg-muted mb-6" />
      ) : upcoming && hasSubscription ? (
        <Card className="mb-6 rounded-2xl border-border bg-primary/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Next charge</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency((upcoming as UpcomingInvoice).amount_due, upcoming.currency)} on{' '}
                  {upcoming.period_end ? formatDate(upcoming.period_end) : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Recent invoices */}
      <Card className="rounded-2xl border-border shadow-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Recent invoices
          </CardTitle>
          <Link to="/app/billing/history">
            <Button variant="ghost" size="sm" className="text-primary rounded-xl">
              View all
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <InvoiceListSkeleton rows={3} />
          ) : invoices.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No invoices yet.
            </div>
          ) : (
            <ul className="space-y-3" role="list">
              {invoices.map((inv) => (
                <li
                  key={inv.id}
                  className={cn(
                    'flex items-center justify-between gap-4 rounded-xl border border-border p-4',
                    'transition-shadow hover:shadow-card'
                  )}
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {formatCurrency((inv as Invoice).amount_paid || (inv as Invoice).amount_due, inv.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(inv.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <InvoiceBadge status={inv.status} />
                    <ReceiptDownloadButton invoiceId={inv.id} size="icon" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </AnimatedPage>
  )
}
