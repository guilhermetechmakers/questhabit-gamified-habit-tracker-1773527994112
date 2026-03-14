import { supabase } from '@/lib/supabase'
import type { HabitHistoryEntry, HabitAnalytics } from '@/types/habit'

function dateFromTimestamp(ts: string): string {
  return ts.slice(0, 10)
}

function computeStreaks(dates: string[]): { current: number; longest: number } {
  const set = new Set(dates)
  const sorted = [...set].sort()
  if (sorted.length === 0) return { current: 0, longest: 0 }
  let longestRun = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]).getTime()
    const curr = new Date(sorted[i]).getTime()
    if (Math.round((curr - prev) / 86400000) === 1) run++
    else { longestRun = Math.max(longestRun, run); run = 1 }
  }
  longestRun = Math.max(longestRun, run)
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  let current = 0
  if (set.has(today) || set.has(yesterday)) {
    const from = set.has(today) ? today : yesterday
    current = 1
    let d = new Date(from)
    for (;;) {
      d.setDate(d.getDate() - 1)
      const prevStr = d.toISOString().slice(0, 10)
      if (!set.has(prevStr)) break
      current++
    }
  }
  return { current, longest: longestRun }
}

export const habitAnalyticsApi = {
  getHistory: async (habitId: string, from?: string, to?: string): Promise<HabitHistoryEntry[]> => {
    let q = supabase
      .from('completions')
      .select('id, habit_id, timestamp, xp_awarded')
      .eq('habit_id', habitId)
      .order('timestamp', { ascending: false })
    if (from) q = q.gte('timestamp', from)
    if (to) q = q.lte('timestamp', to)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    const list = (data ?? []) as { id: string; habit_id: string; timestamp: string; xp_awarded: number }[]
    const byDate = new Map<string, HabitHistoryEntry>()
    for (const row of list) {
      const date = dateFromTimestamp(row.timestamp)
      if (!byDate.has(date)) {
        byDate.set(date, {
          id: row.id,
          habit_id: row.habit_id,
          date,
          completed: true,
          xp_gained: row.xp_awarded ?? 0,
        })
      } else {
        const existing = byDate.get(date)!
        existing.xp_gained += row.xp_awarded ?? 0
      }
    }
    return Array.from(byDate.values()).sort((a, b) => b.date.localeCompare(a.date))
  },

  getAnalytics: async (habitId: string): Promise<HabitAnalytics> => {
    const { data, error } = await supabase
      .from('completions')
      .select('timestamp, xp_awarded')
      .eq('habit_id', habitId)
      .order('timestamp', { ascending: false })
    if (error) throw new Error(error.message)
    const list = (data ?? []) as { timestamp: string; xp_awarded: number }[]
    const dates = list.map((r) => dateFromTimestamp(r.timestamp))
    const { current, longest } = computeStreaks(dates)
    const completionByDate = new Map<string, { completed: boolean; xp_gained: number }>()
    for (const row of list) {
      const date = dateFromTimestamp(row.timestamp)
      if (!completionByDate.has(date)) {
        completionByDate.set(date, { completed: true, xp_gained: row.xp_awarded ?? 0 })
      } else {
        const ex = completionByDate.get(date)!
        ex.xp_gained += row.xp_awarded ?? 0
      }
    }
    const countsByDay: Record<string, number> = {}
    completionByDate.forEach((_, date) => {
      countsByDay[date] = (countsByDay[date] ?? 0) + 1
    })
    const last7: { date: string; completed: boolean; xp_gained: number }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const entry = completionByDate.get(dateStr)
      last7.push({
        date: dateStr,
        completed: !!entry,
        xp_gained: entry?.xp_gained ?? 0,
      })
    }
    last7.reverse()
    return {
      total_completions: list.length,
      current_streak: current,
      longest_streak: longest,
      completion_counts_by_day: countsByDay,
      last_7_days: last7,
    }
  },
}
