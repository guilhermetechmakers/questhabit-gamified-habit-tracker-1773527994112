import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import type { Plan } from '@/types/payments'

function formatPrice(amount: number | undefined, currency: string): string {
  const a = amount ?? 0
  if (a === 0) return 'Free'
  const value = (a / 100).toFixed(2)
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: (currency ?? 'usd').toUpperCase() }).format(Number(value))
}

export function PlanSelector({
  plans,
  selectedPlanId,
  onSelect,
  disabled,
  className,
}: {
  plans: Plan[]
  selectedPlanId: string | null
  onSelect: (planId: string) => void
  disabled?: boolean
  className?: string
}) {
  const list = Array.isArray(plans) ? plans : []
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2', className)} role="radiogroup" aria-label="Select plan">
      {list.map((plan) => {
        const isSelected = selectedPlanId === plan.id
        return (
          <Card
            key={plan.id}
            role="radio"
            aria-checked={isSelected}
            className={cn(
              'cursor-pointer transition-all duration-200 border-2',
              isSelected ? 'border-primary shadow-card-hover bg-primary/5' : 'border-border hover:border-primary/50 hover:shadow-card',
              disabled && 'pointer-events-none opacity-60'
            )}
            onClick={() => !disabled && onSelect(plan.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-lg text-foreground">{plan.name}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {formatPrice(plan.amount, plan.currency)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{plan.interval === 'yearly' ? 'year' : 'month'}
                    </span>
                  </p>
                </div>
                {isSelected && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
