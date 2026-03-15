/**
 * Compact vertical timeline for habit history: completions with timestamps and XP.
 */

import { format, parseISO } from 'date-fns'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface HistoryTimelineEntry {
  id: string
  date: string
  timestamp?: string
  completed: boolean
  xp_gained?: number
  action?: 'complete' | 'skip'
}

export interface HistoryTimelineProps {
  entries: HistoryTimelineEntry[]
  maxItems?: number
  className?: string
  emptyMessage?: string
}

export function HistoryTimeline({
  entries,
  maxItems = 10,
  className,
  emptyMessage = 'No activity yet',
}: HistoryTimelineProps) {
  const list = Array.isArray(entries) ? entries : []
  const shown = list.slice(0, maxItems)

  if (shown.length === 0) {
    return (
      <p className={cn('text-sm text-muted-foreground py-4 text-center', className)} role="status">
        {emptyMessage}
      </p>
    )
  }

  return (
    <ul className={cn('space-y-0', className)} role="list" aria-label="Habit history">
      {shown.map((entry, i) => {
        const isComplete = entry.completed ?? entry.action === 'complete'
        const dateStr = entry.timestamp ?? entry.date
        const timeStr = dateStr.length > 10 ? format(parseISO(dateStr), 'HH:mm') : ''
        const dayStr = dateStr.slice(0, 10)

        return (
          <li
            key={entry.id}
            className={cn(
              'flex items-center gap-3 py-2 text-sm animate-fade-in-up',
              i < shown.length - 1 && 'border-b border-border/60'
            )}
          >
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                isComplete ? 'border-primary bg-primary/15 text-primary' : 'border-muted bg-muted/30 text-muted-foreground'
              )}
              aria-hidden
            >
              {isComplete ? <Check className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-foreground font-medium">{dayStr}</span>
              {timeStr && <span className="text-muted-foreground ml-2">{timeStr}</span>}
            </div>
            {isComplete && (entry.xp_gained ?? 0) > 0 && (
              <span className="shrink-0 text-primary font-medium">+{entry.xp_gained} XP</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
