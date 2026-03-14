import { supabase } from '@/lib/supabase'
import type { UserStats } from '@/types/stats'

export const statsApi = {
  getByUser: async (userId: string): Promise<UserStats | null> => {
    const { data, error } = await supabase.from('user_stats').select('*').eq('user_id', userId).single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }
    return data as UserStats
  },
}
