import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { usePlans, useCreateCheckoutSession } from '@/hooks/use-payments'
import { AnimatedPage } from '@/components/AnimatedPage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlanSelector } from '@/components/billing/PlanSelector'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function BillingCheckout() {
  const [searchParams] = useSearchParams()
  const success = searchParams.get('success') === 'true'
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const { data: plans = [], isLoading: plansLoading } = usePlans()
  const createCheckout = useCreateCheckoutSession()

  const handleCheckout = async () => {
    if (!selectedPlanId) {
      toast.error('Select a plan')
      return
    }
    const origin = window.location.origin
    try {
      const result = await createCheckout.mutateAsync({
        type: 'subscription',
        plan_id: selectedPlanId,
        success_url: `${origin}/app/billing?success=true`,
        cancel_url: `${origin}/app/billing/checkout?canceled=true`,
      })
      if (result?.url) {
        window.location.href = result.url
      } else {
        toast.error('Could not start checkout')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Checkout failed')
    }
  }

  if (success) {
    return (
      <AnimatedPage>
        <Card className="rounded-2xl border-border shadow-card max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-lg text-center">Thank you</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground text-sm">
              Your subscription is active. You can manage it from Billing.
            </p>
            <Link to="/app/billing">
              <Button variant="gradient" className="rounded-xl w-full">Back to Billing</Button>
            </Link>
          </CardContent>
        </Card>
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <Link
        to="/app/billing"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Billing
      </Link>
      <h1 className="text-2xl font-bold text-foreground mb-2">Choose a plan</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Subscribe to unlock premium features. Cancel anytime.
      </p>

      {plansLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : (
        <PlanSelector
          plans={plans}
          selectedPlanId={selectedPlanId}
          onSelect={setSelectedPlanId}
          disabled={createCheckout.isPending}
          className="mb-8"
        />
      )}

      <Card className="rounded-2xl border-border bg-card shadow-card">
        <CardContent className="p-6">
          <Button
            variant="gradient"
            size="lg"
            className={cn(
              'w-full rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98]',
              !selectedPlanId && 'opacity-70'
            )}
            disabled={!selectedPlanId || createCheckout.isPending}
            onClick={handleCheckout}
          >
            {createCheckout.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" aria-hidden />
                Redirecting…
              </>
            ) : (
              'Continue to payment'
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-4">
            You'll complete payment securely on Stripe.
          </p>
        </CardContent>
      </Card>
    </AnimatedPage>
  )
}
