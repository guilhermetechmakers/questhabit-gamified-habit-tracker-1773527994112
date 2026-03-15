import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { LucideIcon } from 'lucide-react'

export interface MetricTileProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  isLoading?: boolean
  className?: string
  'aria-label'?: string
}

export function MetricTile({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  isLoading,
  className,
  'aria-label': ariaLabel,
}: MetricTileProps) {
  return (
    <Card
      className={cn(
        'rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:shadow-card-hover overflow-hidden',
        className
      )}
      aria-label={ariaLabel ?? title}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {Icon && <Icon className="h-4 w-4 text-primary" aria-hidden />}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" aria-hidden />
        ) : (
          <>
            <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
            {(subtitle != null || trend != null) && (
              <p className="text-xs text-muted-foreground mt-1">
                {trend === 'up' && <span className="text-green-600 font-medium">↑ </span>}
                {trend === 'down' && <span className="text-amber-600 font-medium">↓ </span>}
                {subtitle}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
