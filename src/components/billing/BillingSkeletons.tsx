import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function InvoiceListSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="flex items-center justify-between p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function SubscriptionCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('bg-dark-card border-0', className)}>
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56 mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-10 w-32 rounded-xl mt-4" />
      </CardContent>
    </Card>
  )
}

export function PlanSelectorSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2', className)}>
      {[1, 2].map((i) => (
        <Skeleton key={i} className="h-28 rounded-2xl" />
      ))}
    </div>
  )
}
