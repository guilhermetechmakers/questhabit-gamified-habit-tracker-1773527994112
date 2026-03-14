/**
 * Timezone-aware scheduling utilities (RFC5545-lite).
 * Handles daily/weekly/monthly recurrence and next-due computation.
 */
import type { ScheduleJson } from '@/types/habit'

const DEFAULT_TZ = 'UTC'

/**
 * Get the start of today in a given timezone (YYYY-MM-DD).
 */
export function todayInTimezone(tz: string = DEFAULT_TZ): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return formatter.format(new Date()).replace(/\//g, '-')
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

/**
 * Compute the next due date for a habit from its schedule (date only, YYYY-MM-DD).
 * Simplified: daily => today; weekly => next occurrence in week; monthly => next occurrence in month.
 */
export function nextDueDateFromSchedule(schedule: ScheduleJson | null | undefined, tz: string = DEFAULT_TZ): string | null {
  if (!schedule?.frequency) return todayInTimezone(tz)
  const today = todayInTimezone(tz)
  const d = new Date(today + 'T12:00:00Z')

  switch (schedule.frequency) {
    case 'daily':
      return today
    case 'weekly': {
      const days = Array.isArray(schedule.days) && schedule.days.length > 0
        ? schedule.days
        : [d.getUTCDay()]
      for (let i = 0; i <= 7; i++) {
        const next = new Date(d)
        next.setUTCDate(d.getUTCDate() + i)
        if (days.includes(next.getUTCDay())) return next.toISOString().slice(0, 10)
      }
      return today
    }
    case 'monthly': {
      const days = Array.isArray(schedule.days) && schedule.days.length > 0
        ? schedule.days
        : [d.getUTCDate()]
      const currentDate = d.getUTCDate()
      const found = days.filter((day) => day >= currentDate)[0]
      if (found !== undefined) {
        const next = new Date(d)
        next.setUTCDate(found)
        return next.toISOString().slice(0, 10)
      }
      const nextMonth = new Date(d)
      nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1)
      nextMonth.setUTCDate(Math.min(days[0] ?? 1, 28))
      return nextMonth.toISOString().slice(0, 10)
    }
    default:
      return today
  }
}

/**
 * Human-readable schedule label (e.g. "Daily", "Mon, Wed, Fri").
 */
export function formatScheduleLabel(schedule: ScheduleJson | null | undefined): string {
  if (!schedule?.frequency) return 'Daily'
  const freq = schedule.frequency
  if (freq === 'daily') return 'Daily'
  if (freq === 'weekly' && Array.isArray(schedule.days) && schedule.days.length > 0) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return schedule.days.map((d) => dayNames[d % 7]).join(', ')
  }
  if (freq === 'monthly') return 'Monthly'
  return freq.charAt(0).toUpperCase() + freq.slice(1)
}

/**
 * Parse time string HH:mm to minutes since midnight.
 */
export function timeToMinutes(time: string): number {
  const [h, m] = (time || '00:00').split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/**
 * Check if two time ranges (HH:mm, duration minutes) overlap.
 */
export function reminderTimesOverlap(
  time1: string,
  offset1: number,
  time2: string,
  offset2: number,
  durationMinutes: number = 15
): boolean {
  const start1 = timeToMinutes(time1) - (offset1 ?? 0)
  const end1 = start1 + durationMinutes
  const start2 = timeToMinutes(time2) - (offset2 ?? 0)
  const end2 = start2 + durationMinutes
  return start1 < end2 && start2 < end1
}
