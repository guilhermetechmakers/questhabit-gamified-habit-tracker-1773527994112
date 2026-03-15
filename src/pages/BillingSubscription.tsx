import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import {
  useSubscription,
  usePlans,
  useUpcomingInvoice,
  useSubscriptionAction,
  useProrationPreview,
  usePaymentMethods,
  useSetDefaultPaymentMethod,
  useDetachPaymentMethod,
} from '@/hooks/use-payments'
import { AnimatedPage } from '@/components/AnimatedPage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  PlanSelector,
  UpcomingInvoicePanel,
  ProrationPreview,
  CancelationBanner,
  BillingMethodCard,
  ReauthModal,
} from '@/components/billing'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

export default function BillingSubscription() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const { data: subscription, isLoading: subLoading } = useSubscription(userId)
  const { data: plans = [], isLoading: plansLoading } = usePlans()
  const { data: upcoming } = useUpcomingInvoice(userId)
  const subscriptionAction = useSubscriptionAction()
  const { data: paymentMethods = [] } = usePaymentMethods(userId)
  const setDefaultPm = useSetDefaultPaymentMethod()
  const detachPm = useDetachPaymentMethod()
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [reauthOpen, setReauthOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const { data: prorationPreview, isLoading: prorationLoading } = useProrationPreview(
    selectedPlanId && selectedPlanId !== subscription?.plan_id ? selectedPlanId : null
  )

  const hasSubscription = subscription && ['active', 'trialing'].includes(subscription.status)
  const cancelAtPeriodEnd = subscription?.cancel_at_period_end ?? false

  const runAfterReauth = async () => {
    if (pendingAction) {
      await pendingAction()
      setPendingAction(null)
    }
    setReauthOpen(false)
  }

  const requireReauth = (action: () => void) => {
    setPendingAction(() => action)
    setReauthOpen(true)
  }

  const handleChangePlan = () => {
    if (!selectedPlanId || selectedPlanId === subscription?.plan_id) return
    requireReauth(async () => {
      try {
        await subscriptionAction.mutateAsync({
          action: 'update',
          plan_id: selectedPlanId,
          proration: true,
        })
        toast.success('Plan updated. Changes apply at next billing cycle.')
        setSelectedPlanId(null)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Update failed')
      }
    })
  }

  const handleCancel = () => {
    requireReauth(async () => {
      try {
        await subscriptionAction.mutateAsync({ action: 'cancel' })
        toast.success('Subscription will cancel at the end of the billing period.')
        setShowCancelConfirm(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Cancel failed')
      }
    })
  }

  const handleReactivate = () => {
    requireReauth(async () => {
      try {
        await subscriptionAction.mutateAsync({ action: 'reactivate' })
        toast.success('Subscription reactivated.')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Reactivation failed')
      }
    })
  }

  const handleSetDefaultPm = (paymentMethodId: string) => {
    requireReauth(async () => {
      try {
        await setDefaultPm.mutateAsync(paymentMethodId)
        toast.success('Default payment method updated.')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Update failed')
      }
    })
  }

  const handleDetachPm = (paymentMethodId: string) => {
    requireReauth(async () => {
      try {
        await detachPm.mutateAsync(paymentMethodId)
        toast.success('Payment method removed.')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Remove failed')
      }
    })
  }

  if (subLoading || !userId) {
    return (
      <AnimatedPage>
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-40 w-full rounded-2xl mb-6" />
      </AnimatedPage>
    )
  }

  if (!hasSubscription) {
    return (
      <AnimatedPage>
        <Link
          to="/app/billing"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Billing
        </Link>
        <Card className="rounded-2xl border-border">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">You don't have an active subscription.</p>
            <Link to="/app/billing/checkout">
              <Button variant="gradient" className="rounded-xl">
                Subscribe
              </Button>
            </Link>
          </CardContent>
        </Card>
      </AnimatedPage>
    )
  }

  const selectedPlan = (plans ?? []).find((p) => p.id === selectedPlanId)

  return (
    <AnimatedPage>
      <Link
        to="/app/billing"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Billing
      </Link>
      <h1 className="text-2xl font-bold text-foreground mb-2">Manage subscription</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Current period ends {formatDate(subscription?.current_period_end ?? null)}.
        {cancelAtPeriodEnd && (
          <span className="block mt-1 text-primary font-medium">Canceling at period end.</span>
        )}
      </p>

      {cancelAtPeriodEnd && (
        <CancelationBanner
          cancelAtPeriodEnd={cancelAtPeriodEnd}
          periodEndDate={subscription?.current_period_end ?? null}
          onReactivate={handleReactivate}
          isReactivating={subscriptionAction.isPending}
          className="mb-6"
        />
      )}

      {upcoming && (
        <UpcomingInvoicePanel
          amountDue={upcoming.amount_due}
          currency={upcoming.currency}
          periodEnd={upcoming.period_end}
          className="mb-6"
        />
      )}

      <Card className="mb-6 rounded-2xl border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Payment methods</CardTitle>
        </CardHeader>
        <CardContent>
          {Array.isArray(paymentMethods) && paymentMethods.length > 0 ? (
            <ul className="space-y-3" role="list">
              {(paymentMethods ?? []).map((pm) => (
                <li key={pm.id}>
                  <BillingMethodCard
                    method={pm}
                    onSetDefault={handleSetDefaultPm}
                    onRemove={handleDetachPm}
                    isSettingDefault={setDefaultPm.isPending}
                    isRemoving={detachPm.isPending}
                    disabled={setDefaultPm.isPending || detachPm.isPending}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground py-4">No payment methods on file. Add one at checkout.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6 rounded-2xl border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Change plan</CardTitle>
        </CardHeader>
        <CardContent>
          {plansLoading ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : (
            <>
              <PlanSelector
                plans={plans}
                selectedPlanId={selectedPlanId ?? subscription?.plan_id ?? null}
                onSelect={setSelectedPlanId}
                disabled={subscriptionAction.isPending}
                className="mb-4"
              />
              {selectedPlanId && selectedPlanId !== subscription?.plan_id && (
                <>
                  <ProrationPreview
                    preview={prorationPreview ?? null}
                    isLoading={prorationLoading}
                    planName={selectedPlan?.name}
                    className="mb-4"
                  />
                  <Button
                    variant="gradient"
                    size="sm"
                    className="rounded-xl mt-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    disabled={subscriptionAction.isPending}
                    onClick={handleChangePlan}
                  >
                    {subscriptionAction.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Apply change'
                    )}
                  </Button>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className={cn('rounded-2xl border-border', cancelAtPeriodEnd && 'border-destructive/30')}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Cancel subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCancelConfirm ? (
            <>
              <p className="text-sm text-muted-foreground">
                Your subscription will remain active until the end of the current period. No further
                charges will be made.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setShowCancelConfirm(false)}
                >
                  Keep subscription
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-xl"
                  disabled={subscriptionAction.isPending}
                  onClick={handleCancel}
                >
                  {subscriptionAction.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Confirm cancel'
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Cancel at the end of your billing period. You can resubscribe anytime.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-destructive border-destructive/50 hover:bg-destructive/10"
                onClick={() => setShowCancelConfirm(true)}
              >
                Cancel subscription
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <ReauthModal
        open={reauthOpen}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null)
          setReauthOpen(open)
        }}
        userEmail={user?.email ?? ''}
        onSuccess={runAfterReauth}
        title="Confirm your identity"
        description="Re-enter your password to continue with this billing action."
      />
    </AnimatedPage>
  )
}
