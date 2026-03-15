import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Plus } from 'lucide-react'
import { usePaymentMethods, useSetDefaultPaymentMethod, useDetachPaymentMethod } from '@/hooks/use-payments'
import { useAuth } from '@/contexts/auth-context'
import { BillingMethodCard } from '@/components/billing/BillingMethodCard'
import { ReauthModal } from '@/components/billing/ReauthModal'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { PaymentMethod } from '@/types/payments'

export function PaymentMethodsSection({ className }: { className?: string }) {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const { data: methods = [], isLoading } = usePaymentMethods(userId)
  const setDefault = useSetDefaultPaymentMethod()
  const detach = useDetachPaymentMethod()
  const [reauthForAction, setReauthForAction] = useState<(() => void) | null>(null)
  const [reauthOpen, setReauthOpen] = useState(false)

  const list = Array.isArray(methods) ? (methods as PaymentMethod[]) : []

  const requestReauthThen = (fn: () => void) => {
    setReauthForAction(() => fn)
    setReauthOpen(true)
  }

  const runAfterReauth = () => {
    reauthForAction?.()
    setReauthForAction(null)
    setReauthOpen(false)
  }

  const handleSetDefault = (paymentMethodId: string) => {
    setDefault.mutate(paymentMethodId, {
      onSuccess: () => toast.success('Default payment method updated'),
      onError: (e) => toast.error(e instanceof Error ? e.message : 'Update failed'),
    })
  }

  const handleRemove = (paymentMethodId: string) => {
    detach.mutate(paymentMethodId, {
      onSuccess: () => toast.success('Payment method removed'),
      onError: (e) => toast.error(e instanceof Error ? e.message : 'Remove failed'),
    })
  }

  return (
    <>
      <Card className={cn('rounded-2xl border-border shadow-card bg-card', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" aria-hidden />
            Payment methods
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="h-20 animate-pulse rounded-xl bg-muted" />
          ) : list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">No payment methods on file.</p>
              <Link to="/app/billing/checkout">
                <Button variant="gradient" size="sm" className="rounded-xl">
                  <Plus className="h-4 w-4 mr-2" aria-hidden />
                  Add payment method
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <ul className="space-y-2" role="list">
                {list.map((pm) => (
                  <li key={pm.id}>
                    <BillingMethodCard
                      method={pm}
                      onSetDefault={
                        pm.is_default
                          ? undefined
                          : () => requestReauthThen(() => handleSetDefault(pm.stripe_payment_method_id))
                      }
                      onRemove={() =>
                        requestReauthThen(() => handleRemove(pm.stripe_payment_method_id))
                      }
                      isSettingDefault={setDefault.isPending}
                      isRemoving={detach.isPending}
                    />
                  </li>
                ))}
              </ul>
              <Link to="/app/billing/checkout">
                <Button variant="outline" size="sm" className="rounded-xl w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" aria-hidden />
                  Add payment method
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      <ReauthModal
        open={reauthOpen}
        onOpenChange={(open) => {
          if (!open) setReauthForAction(null)
          setReauthOpen(open)
        }}
        userEmail={user?.email ?? ''}
        onSuccess={runAfterReauth}
        title="Confirm your identity"
        description="Re-enter your password to update payment methods."
      />
    </>
  )
}
