import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Flame } from 'lucide-react'

export interface KPIStreakCardProps {
  title: string
  value: number
  label?: string
  isLoading?: boolean
  className?: string
  'aria-label'?: string
}

export function KPIStreakCard({
  title,
  value,
  label,
  isLoading,
  className,
  'aria-label': ariaLabel,
}: KPIStreakCardProps) {
  return (
    <Card
      className={cn(
        'rounded-2xl border border-border bg-gradient-to-br from-card to-primary/5 shadow-card transition-all duration-300 hover:shadow-card-hover overflow-hidden',
        className
      )}
      aria-label={ariaLabel ?? title}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-primary" aria-hidden />
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" aria-hidden />
        ) : (
          <>
            <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
            {label && <p className="text-xs text-muted-foreground mt-1">{label}</p>}
          </>
        )}
      </CardContent>
    </Card>
  )
}
