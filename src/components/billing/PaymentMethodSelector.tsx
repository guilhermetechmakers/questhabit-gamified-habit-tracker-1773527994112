import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CreditCard, Check } from 'lucide-react'
import type { PaymentMethod } from '@/types/payments'

const brandLabel: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  discover: 'Discover',
  card: 'Card',
}

export function PaymentMethodSelector({
  methods,
  selectedId,
  onSelect,
  disabled,
  className,
}: {
  methods: PaymentMethod[]
  selectedId: string | null
  onSelect: (id: string) => void
  disabled?: boolean
  className?: string
}) {
  const list = Array.isArray(methods) ? methods : []
  if (list.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No payment methods on file.</p>
    )
  }
  return (
    <div className={cn('space-y-2', className)} role="listbox" aria-label="Payment methods">
      {list.map((pm) => {
        const isSelected = selectedId === pm.stripe_payment_method_id || selectedId === pm.id
        const brand = brandLabel[pm.brand?.toLowerCase() ?? ''] ?? pm.brand ?? 'Card'
        return (
          <Card
            key={pm.id}
            role="option"
            aria-selected={isSelected}
            className={cn(
              'cursor-pointer transition-all duration-200 border-2',
              isSelected ? 'border-primary shadow-card-hover' : 'border-border hover:border-primary/50 hover:shadow-card',
              disabled && 'pointer-events-none opacity-60'
            )}
            onClick={() => !disabled && onSelect(pm.stripe_payment_method_id)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{brand} •••• {pm.last4}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires {String(pm.exp_month).padStart(2, '0')}/{pm.exp_year}
                    {pm.is_default && ' · Default'}
                  </p>
                </div>
              </div>
              {isSelected && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
