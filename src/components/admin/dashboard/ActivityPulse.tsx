import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Activity } from 'lucide-react'

export interface ActivityItem {
  id: string
  action: string
  target?: string
  time: string
}

export interface ActivityPulseProps {
  items: ActivityItem[]
  isLoading?: boolean
  maxItems?: number
  className?: string
}

export function ActivityPulse({
  items,
  isLoading,
  maxItems = 8,
  className,
}: ActivityPulseProps) {
  const list = Array.isArray(items) ? items.slice(0, maxItems) : []

  return (
    <Card
      className={cn('rounded-2xl border border-border bg-card shadow-card overflow-hidden', className)}
      role="region"
      aria-label="Recent activity"
    >
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" /> Recent activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {(Array.from({ length: 4 }) ?? []).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
        ) : (
          <ul className="space-y-2">
            {(list ?? []).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="font-medium">{item.action}</span>
                <span className="text-muted-foreground text-xs shrink-0">{item.time}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
