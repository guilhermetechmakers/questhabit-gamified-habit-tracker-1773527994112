import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { ExportSchedule } from '@/types/analytics'
import { CalendarClock, Pause, Play, Trash2 } from 'lucide-react'

export interface ScheduleManagerProps {
  schedules: ExportSchedule[]
  isLoading?: boolean
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onDelete?: (id: string) => void
  onCreate?: (cron: string, format: 'csv' | 'json') => void
  className?: string
}

export function ScheduleManager({
  schedules,
  isLoading,
  onPause,
  onResume,
  onDelete,
  onCreate,
  className,
}: ScheduleManagerProps) {
  const [newCron, setNewCron] = useState('')
  const [newFormat, setNewFormat] = useState<'csv' | 'json'>('csv')
  const list = schedules ?? []

  if (isLoading) {
    return (
      <Card className={cn('rounded-2xl border border-border bg-card', className)}>
        <CardHeader>
          <CardTitle className="text-lg">Export schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'rounded-2xl border border-border bg-card shadow-card transition-all duration-300',
        className
      )}
    >
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarClock className="h-5 w-5" aria-hidden />
          Export schedules
        </CardTitle>
        <p className="text-sm text-muted-foreground">Recurring exports (cron)</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {onCreate && (
          <div className="flex flex-wrap items-end gap-2 p-3 rounded-xl bg-muted/30">
            <div className="flex-1 min-w-[120px]">
              <label htmlFor="schedule-cron" className="text-xs text-muted-foreground block mb-1">
                Cron expression
              </label>
              <Input
                id="schedule-cron"
                placeholder="0 9 * * 1"
                value={newCron}
                onChange={(e) => setNewCron(e.target.value)}
                className="rounded-xl"
                aria-label="Cron expression"
              />
            </div>
            <div className="w-24">
              <label htmlFor="schedule-format" className="text-xs text-muted-foreground block mb-1">
                Format
              </label>
              <select
                id="schedule-format"
                value={newFormat}
                onChange={(e) => setNewFormat(e.target.value as 'csv' | 'json')}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                aria-label="Export format"
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
            <Button
              variant="gradient"
              size="sm"
              className="rounded-xl"
              onClick={() => {
                if (newCron.trim()) {
                  onCreate(newCron.trim(), newFormat)
                  setNewCron('')
                }
              }}
              disabled={!newCron.trim()}
            >
              Add schedule
            </Button>
          </div>
        )}
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center text-muted-foreground">
            <CalendarClock className="h-10 w-10 mb-2 opacity-50" aria-hidden />
            <p>No schedules</p>
          </div>
        ) : (
          <ul className="space-y-2" role="list">
            {list.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3 hover:bg-muted/20 transition-colors"
              >
                <div>
                  <p className="font-medium">{s.export_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.cron_expression ?? '—'} · {s.format} · next: {s.next_run ? new Date(s.next_run).toLocaleString() : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {s.is_active && onPause && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => onPause(s.id)}
                      aria-label="Pause schedule"
                    >
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                  {!s.is_active && onResume && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => onResume(s.id)}
                      aria-label="Resume schedule"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                      onClick={() => onDelete(s.id)}
                      aria-label="Delete schedule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
