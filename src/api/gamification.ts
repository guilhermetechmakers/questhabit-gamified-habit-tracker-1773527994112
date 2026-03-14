/**
 * Gamification API: profile, config, leaderboard, redeem, undo.
 * Uses Supabase Edge Functions for server-side logic.
 */
import { supabase } from '@/lib/supabase'
import type {
  GamificationProfile,
  GamificationConfig,
  LeaderboardResponse,
  CompleteEventPayload,
  UndoEventPayload,
  RedeemRewardPayload,
} from '@/types/gamification'

export interface ProcessCompletionResult {
  completion: unknown
  xp_awarded: number
  xp_total: number
  level: number
  current_streak: number
  longest_streak?: number
  reward_points?: number
  habit_streak?: number
  badges_awarded?: string[]
  already_processed?: boolean
}

export const gamificationApi = {
  processCompletion: async (payload: CompleteEventPayload): Promise<ProcessCompletionResult> => {
    const { data, error } = await supabase.functions.invoke('process-completion', {
      body: {
        habit_id: payload.habit_id,
        completion_id: payload.completion_id,
        timestamp: payload.timestamp,
        source: payload.source ?? 'app',
      },
    })
    if (error) throw new Error(error.message)
    const result = data as ProcessCompletionResult
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error)
    return result
  },

  undoCompletion: async (payload: UndoEventPayload): Promise<{ success: boolean; xp_total: number; level: number; current_streak: number; rewards_points: number }> => {
    const { data, error } = await supabase.functions.invoke('gamification-undo', {
      body: { completion_id: payload.completion_id },
    })
    if (error) throw new Error(error.message)
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error)
    return data as { success: boolean; xp_total: number; level: number; current_streak: number; rewards_points: number }
  },

  getProfile: async (userId: string): Promise<GamificationProfile> => {
    const { data, error } = await supabase.functions.invoke('gamification-profile', {
      body: { user_id: userId },
    })
    if (error) throw new Error(error.message)
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error)
    return (data ?? {}) as GamificationProfile
  },

  getConfig: async (): Promise<GamificationConfig> => {
    const { data, error } = await supabase.functions.invoke('gamification-config', {
      body: {},
    })
    if (error) throw new Error(error.message)
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error)
    return (data ?? {}) as GamificationConfig
  },

  getLeaderboard: async (params: { scope?: string; metric?: string; page?: number; pageSize?: number }): Promise<LeaderboardResponse> => {
    const scope = params.scope ?? 'global'
    const metric = params.metric ?? 'xp'
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 20
    const { data, error } = await supabase.functions.invoke('get-leaderboard', {
      body: { scope, metric, page, pageSize },
    })
    if (error) throw new Error(error.message)
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error)
    const raw = data as LeaderboardResponse & { entries?: LeaderboardResponse['entries']; total?: number; page?: number; page_size?: number }
    return {
      entries: Array.isArray(raw?.entries) ? raw.entries : [],
      total: typeof raw?.total === 'number' ? raw.total : 0,
      page: typeof raw?.page === 'number' ? raw.page : page,
      page_size: typeof raw?.page_size === 'number' ? raw.page_size : pageSize,
    }
  },

  redeemReward: async (payload: RedeemRewardPayload): Promise<{ success: boolean; reward_name?: string; points_spent?: number }> => {
    const { data, error } = await supabase.functions.invoke('redeem-reward', {
      body: { reward_id: payload.reward_id },
    })
    if (error) throw new Error(error.message)
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error)
    return data as { success: boolean; reward_name?: string; points_spent?: number }
  },

  trackEvent: async (eventType: string, properties?: Record<string, unknown>): Promise<void> => {
    await supabase.functions.invoke('analytics-track', {
      body: { event_type: eventType, properties },
    }).catch(() => {})
  },
}
