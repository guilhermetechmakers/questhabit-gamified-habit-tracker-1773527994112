import { supabase } from '@/lib/supabase'
import type {
  Habit,
  CreateHabitInput,
  UpdateHabitInput,
  HabitHistoryEntry,
  HabitAnalytics,
} from '@/types/habit'
import type { PaginatedResponse } from '@/lib/api'
import { remindersApi } from '@/api/reminders'

export type HabitListState = 'active' | 'archived'

export interface HabitListParams {
  userId: string
  state?: HabitListState
  search?: string
  page?: number
  limit?: number
}

export const habitsApi = {
  getAll: async (userId: string): Promise<Habit[]> => {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('archived', false)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []) as Habit[]
  },

  getAllIncludingArchived: async (userId: string): Promise<Habit[]> => {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []) as Habit[]
  },

  list: async (
    params: HabitListParams
  ): Promise<PaginatedResponse<Habit>> => {
    const { userId, state = 'active', search = '', page = 1, limit = 20 } = params
    let q = supabase
      .from('habits')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (state === 'active') q = q.eq('archived', false)
    if (state === 'archived') q = q.eq('archived', true)
    if (search.trim()) q = q.ilike('title', `%${search.trim()}%`)

    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error, count } = await q.range(from, to)

    if (error) throw new Error(error.message)
    const list = Array.isArray(data) ? data : []
    return {
      data: list as Habit[],
      count: count ?? list.length,
      page,
      limit,
    }
  },

  getById: async (id: string): Promise<Habit | null> => {
    const { data, error } = await supabase.from('habits').select('*').eq('id', id).single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }
    return data as Habit
  },

  create: async (input: CreateHabitInput): Promise<Habit> => {
    const { data, error } = await supabase.from('habits').insert(input).select().single()
    if (error) throw new Error(error.message)
    return data as Habit
  },

  update: async (id: string, updates: UpdateHabitInput): Promise<Habit> => {
    const { data, error } = await supabase
      .from('habits')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as Habit
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('habits').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  archive: async (id: string): Promise<Habit> => {
    return habitsApi.update(id, { archived: true })
  },

  unarchive: async (id: string): Promise<Habit> => {
    return habitsApi.update(id, { archived: false })
  },

  getByIdWithReminders: async (id: string): Promise<Habit | null> => {
    const habit = await habitsApi.getById(id)
    if (!habit) return null
    const reminders = await remindersApi.getByHabitId(id).catch(() => [])
    return { ...habit, reminders: reminders ?? [] } as Habit
  },

  getHistory: async (habitId: string, from?: string, to?: string): Promise<HabitHistoryEntry[]> => {
    let q = supabase
      .from('completions')
      .select('id, timestamp, xp_awarded')
      .eq('habit_id', habitId)
      .order('timestamp', { ascending: false })
    if (from) q = q.gte('timestamp', from)
    if (to) q = q.lte('timestamp', to)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    const list = Array.isArray(data) ? data : []
    const byDate = new Map<string, { id: string; xp_gained: number }>()
    for (const row of list) {
      const date = (row as { timestamp: string }).timestamp?.slice(0, 10) ?? ''
      if (!date) continue
      const existing = byDate.get(date)
      const xp = (row as { xp_awarded?: number }).xp_awarded ?? 0
      if (!existing) byDate.set(date, { id: (row as { id: string }).id, xp_gained: xp })
      else existing.xp_gained += xp
    }
    return Array.from(byDate.entries()).map(([date, v]) => ({
      id: v.id,
      habit_id: habitId,
      date,
      completed: true,
      xp_gained: v.xp_gained,
    }))
  },

  getAnalytics: async (habitId: string): Promise<HabitAnalytics> => {
    const { data, error } = await supabase
      .from('completions')
      .select('timestamp, xp_awarded')
      .eq('habit_id', habitId)
      .order('timestamp', { ascending: true })
    if (error) throw new Error(error.message)
    const list = Array.isArray(data) ? data : []
    const dates = list.map((r) => (r as { timestamp: string }).timestamp?.slice(0, 10)).filter(Boolean) as string[]
    const uniqueDates = [...new Set(dates)]
    const totalCompletions = uniqueDates.length
    const completionCountsByDay: Record<string, number> = {}
    for (const d of uniqueDates) {
      completionCountsByDay[d] = dates.filter((x) => x === d).length
    }
    let currentStreak = 0
    let longestStreak = 0
    if (uniqueDates.length > 0) {
      const sorted = [...uniqueDates].sort()
      const today = new Date().toISOString().slice(0, 10)
      let run = 0
      for (let i = sorted.length - 1; i >= 0; i--) {
        const expected = new Date(today)
        expected.setDate(expected.getDate() - (sorted.length - 1 - i))
        const expectedStr = expected.toISOString().slice(0, 10)
        if (sorted[i] === expectedStr) run++
        else break
      }
      currentStreak = run
      run = 0
      for (let i = 0; i < sorted.length; i++) {
        if (i === 0) run = 1
        else if (sorted[i] === nextDay(sorted[i - 1])) run++
        else run = 1
        longestStreak = Math.max(longestStreak, run)
      }
    }
    const last7: { date: string; completed: boolean; xp_gained: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const dayCompletions = list.filter((r) => ((r as { timestamp: string }).timestamp ?? '').startsWith(dateStr))
      const xp = dayCompletions.reduce((s, r) => s + ((r as { xp_awarded?: number }).xp_awarded ?? 0), 0)
      last7.push({ date: dateStr, completed: dayCompletions.length > 0, xp_gained: xp })
    }
    return {
      total_completions: totalCompletions,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      completion_counts_by_day: completionCountsByDay,
      last_7_days: last7,
    }
  },
}

function nextDay(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}
