import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { RetentionCurve } from '@/types/analytics'

const COLORS = [
  'rgb(255, 154, 87)',
  'rgb(124, 97, 255)',
  'rgb(84, 216, 169)',
  'rgb(74, 179, 255)',
  'rgb(191, 167, 255)',
]

export interface RetentionChartProps {
  curves: RetentionCurve[]
  isLoading?: boolean
  onExport?: () => void
  className?: string
}

export function RetentionChart({
  curves,
  isLoading,
  onExport,
  className,
}: RetentionChartProps) {
  const curvesList = curves ?? []
  const periods = curvesList[0]?.points?.map((p) => p.period) ?? []
  const chartData = (periods ?? []).map((period, i) => {
    const point: Record<string, string | number> = { period }
    curvesList.forEach((curve, j) => {
      const p = curve.points?.[i]
      point[curve.cohortLabel ?? curve.cohortId ?? `cohort_${j}`] =
        p?.pct ?? 0
    })
    return point
  })

  if (isLoading) {
    return (
      <Card className={cn('rounded-2xl border border-border bg-card', className)}>
        <CardHeader>
          <CardTitle className="text-lg">Retention curve</CardTitle>
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Retention curve</CardTitle>
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="text-sm font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-2 py-1"
          >
            Export
          </button>
        )}
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground">
            No retention data yet
          </div>
        ) : (
          <div className="h-64 w-full" role="img" aria-label="Retention over time by cohort">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid rgb(var(--border))',
                    background: 'rgb(var(--card))',
                  }}
                  formatter={(value: number) => [`${Number(value).toFixed(1)}%`, 'Retention']}
                />
                <Legend />
                {(curvesList ?? []).map((curve, i) => (
                  <Line
                    key={curve.cohortId}
                    type="monotone"
                    dataKey={curve.cohortLabel ?? curve.cohortId}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name={curve.cohortLabel ?? curve.cohortId}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
