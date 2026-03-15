import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { FunnelStep } from '@/types/analytics'

const PRIMARY_RGB = '255, 154, 87'
const SECONDARY_RGB = '124, 97, 255'

export interface FunnelChartProps {
  steps: FunnelStep[]
  isLoading?: boolean
  className?: string
}

export function FunnelChart({ steps, isLoading, className }: FunnelChartProps) {
  const data = (steps ?? []).map((s, i) => ({
    name: s.name,
    count: s.count,
    dropoff: s.dropoff ?? 0,
    fill: i % 2 === 0 ? `rgb(${PRIMARY_RGB})` : `rgb(${SECONDARY_RGB})`,
  }))

  if (isLoading) {
    return (
      <Card className={cn('rounded-2xl border border-border bg-card', className)}>
        <CardHeader>
          <CardTitle className="text-lg">Conversion funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:shadow-card-hover',
        className
      )}
    >
      <CardHeader>
        <CardTitle className="text-lg">Conversion funnel</CardTitle>
        <p className="text-sm text-muted-foreground">Event counts by step</p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground">
            No funnel data yet
          </div>
        ) : (
          <div className="h-64 w-full" role="img" aria-label="Conversion funnel">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 8, right: 8, left: 60, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={56}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid rgb(var(--border))',
                    background: 'rgb(var(--card))',
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {(data ?? []).map((_, i) => (
                    <Cell key={i} fill={data[i]?.fill ?? `rgb(${PRIMARY_RGB})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
