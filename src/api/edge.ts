import { supabase } from '@/lib/supabase'

export const edgeApi = {
  processCompletion: async (habitId: string, source: 'app' | 'reminder' | 'offline_sync' = 'app') => {
    const { data, error } = await supabase.functions.invoke('process-completion', {
      body: { habit_id: habitId, source },
    })
    if (error) throw new Error(error.message)
    return data as {
      completion: unknown
      xp_awarded: number
      xp_total: number
      level: number
      current_streak: number
      longest_streak: number
    }
  },
}
