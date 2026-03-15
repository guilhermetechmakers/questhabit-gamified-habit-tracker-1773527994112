import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { CohortRow } from '@/types/analytics'

const PRIMARY_RGB = '255, 154, 87'

export interface CohortChartProps {
  cohorts: CohortRow[]
  periodType?: string
  isLoading?: boolean
  className?: string
}

export function CohortChart({
  cohorts,
  periodType = 'week',
  isLoading,
  className,
}: CohortChartProps) {
  const data = (cohorts ?? []).slice(0, 14).map((c) => ({
    name: c.cohortName ?? c.period,
    size: c.size,
    retained: c.retained,
    pct: (c.retentionRate ?? 0) * 100,
  }))

  if (isLoading) {
    return (
      <Card className={cn('rounded-2xl border border-border bg-card', className)}>
        <CardHeader>
          <CardTitle className="text-lg">Cohort analysis</CardTitle>
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
        <CardTitle className="text-lg">Cohort analysis</CardTitle>
        <p className="text-sm text-muted-foreground">By {periodType}</p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground">
            No cohort data yet
          </div>
        ) : (
          <div className="h-64 w-full" role="img" aria-label="Cohort retention bar chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid rgb(var(--border))',
                    background: 'rgb(var(--card))',
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'pct' ? `${Number(value).toFixed(1)}%` : value,
                    name === 'pct' ? 'Retention' : name === 'retained' ? 'Retained' : 'Size',
                  ]}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="pct" fill={`rgb(${PRIMARY_RGB})`} radius={[4, 4, 0, 0]} name="Retention %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
