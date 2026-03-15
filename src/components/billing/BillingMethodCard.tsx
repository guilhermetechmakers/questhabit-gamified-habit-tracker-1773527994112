'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Trash2, Star, Loader2 } from 'lucide-react'
import type { PaymentMethod } from '@/types/payments'
import { cn } from '@/lib/utils'

const brandLabel: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  discover: 'Discover',
  card: 'Card',
}

export interface BillingMethodCardProps {
  method: PaymentMethod
  onSetDefault?: (paymentMethodId: string) => void
  onRemove?: (paymentMethodId: string) => void
  isSettingDefault?: boolean
  isRemoving?: boolean
  disabled?: boolean
  className?: string
}

export function BillingMethodCard({
  method,
  onSetDefault,
  onRemove,
  isSettingDefault,
  isRemoving,
  disabled,
  className,
}: BillingMethodCardProps) {
  const brand = brandLabel[method.brand?.toLowerCase() ?? ''] ?? method.brand ?? 'Card'
  const isDefault = method.is_default === true

  return (
    <Card
      className={cn(
        'rounded-2xl border-border transition-all duration-200 hover:shadow-card',
        isDefault && 'border-primary/40 bg-primary/5',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground">
                {brand} •••• {method.last4 ?? '****'}
              </p>
              <p className="text-xs text-muted-foreground">
                Expires {String(method.exp_month ?? 0).padStart(2, '0')}/{method.exp_year ?? '—'}
                {isDefault && (
                  <span className="ml-2 inline-flex items-center gap-1 text-primary">
                    <Star className="h-3 w-3 fill-current" aria-hidden />
                    Default
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isDefault && onSetDefault && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => onSetDefault(method.stripe_payment_method_id)}
                disabled={disabled || isSettingDefault}
                aria-label={`Set ${brand} ending ${method.last4} as default`}
              >
                {isSettingDefault ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  'Set default'
                )}
              </Button>
            )}
            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => onRemove(method.stripe_payment_method_id)}
                disabled={disabled || isRemoving}
                aria-label={`Remove ${brand} ending ${method.last4}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
