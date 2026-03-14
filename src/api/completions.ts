import { supabase } from '@/lib/supabase'
import type { Completion } from '@/types/completion'

export const completionsApi = {
  getByHabit: async (habitId: string): Promise<Completion[]> => {
    const { data, error } = await supabase
      .from('completions')
      .select('*')
      .eq('habit_id', habitId)
      .order('timestamp', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []) as Completion[]
  },

  getByUser: async (userId: string, from?: string, to?: string, limit?: number): Promise<Completion[]> => {
    let q = supabase.from('completions').select('*').eq('user_id', userId).order('timestamp', { ascending: false })
    if (from) q = q.gte('timestamp', from)
    if (to) q = q.lte('timestamp', to)
    if (limit != null) q = q.limit(limit)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return (data ?? []) as Completion[]
  },
}
