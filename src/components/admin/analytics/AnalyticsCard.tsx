import { type ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface AnalyticsCardProps {
  title: string
  value: string | number
  delta?: number
  deltaLabel?: string
  sparkline?: number[]
  icon?: ReactNode
  isLoading?: boolean
  className?: string
}

export function AnalyticsCard({
  title,
  value,
  delta,
  deltaLabel,
  sparkline,
  icon,
  isLoading,
  className,
}: AnalyticsCardProps) {
  return (
    <Card
      className={cn(
        'rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:shadow-card-hover overflow-hidden',
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {icon && <span className="text-primary [&_svg]:h-4 [&_svg]:w-4" aria-hidden>{icon}</span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <p className="text-2xl font-bold text-foreground tabular-nums" aria-live="polite">
              {value}
            </p>
            {delta != null && (
              <p
                className={cn(
                  'text-xs font-medium',
                  delta >= 0 ? 'text-green-600' : 'text-destructive'
                )}
              >
                {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}% {deltaLabel ?? 'vs last period'}
              </p>
            )}
            {sparkline != null && sparkline.length > 0 && (
              <div className="flex items-end gap-0.5 h-8 mt-2" aria-hidden>
                {(sparkline ?? []).slice(-14).map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 min-w-[2px] rounded-sm bg-primary/30 animate-fade-in"
                    style={{ height: `${Math.max(4, (v / Math.max(...sparkline, 1)) * 100)}%` }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
