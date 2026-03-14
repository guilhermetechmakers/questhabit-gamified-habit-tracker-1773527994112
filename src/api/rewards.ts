import { supabase } from '@/lib/supabase'
import type { Reward, UserReward } from '@/types/gamification'

export const rewardsApi = {
  list: async (): Promise<Reward[]> => {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('active', true)
      .order('points_cost', { ascending: true })
    if (error) throw new Error(error.message)
    return Array.isArray(data) ? (data as Reward[]) : []
  },

  getRedeemedByUser: async (userId: string): Promise<UserReward[]> => {
    const { data, error } = await supabase
      .from('reward_redemptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return Array.isArray(data) ? (data as UserReward[]) : []
  },
}
