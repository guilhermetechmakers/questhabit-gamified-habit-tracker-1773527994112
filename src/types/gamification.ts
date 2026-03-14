/**
 * Gamification Engine types: profile, config, leaderboard, rewards.
 */

export interface GamificationProfileBadge {
  badge_id: string
  /** Optional id for compatibility with APIs that return id instead of badge_id */
  id?: string
  name: string
  icon_url: string | null
  rarity: string
  awarded_at: string
}

export interface GamificationProfile {
  user_id: string
  total_xp: number
  level: number
  current_streak: number
  longest_streak: number
  rewards_points: number
  /** @deprecated Use rewards_points. Kept for API compatibility. */
  reward_points?: number
  badges: GamificationProfileBadge[]
  habit_streaks?: { habit_id: string; current_streak: number; longest_streak: number }[]
  last_active: string | null
}

export interface GamificationConfig {
  xp_per_level_base?: number
  level_multiplier?: number
  points_per_completion?: number
  level_thresholds?: number[]
  [key: string]: unknown
}

export type LeaderboardScope = 'global' | 'friends'
export type LeaderboardMetric = 'xp' | 'streak' | 'challenge_points'

export interface LeaderboardEntry {
  user_id: string
  display_name: string | null
  avatar_url: string | null
  rank: number
  xp_total: number
  level: number
  current_streak: number
  challenge_points?: number
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[]
  total: number
  page: number
  page_size: number
}

export interface Reward {
  id: string
  name: string
  description: string | null
  reward_type: string
  points_cost: number
  badge_id: string | null
  icon_url: string | null
  sort_order: number
  created_at: string
}

export interface UserReward {
  id: string
  user_id: string
  reward_id: string
  redeemed_at: string
}

/** Alias for UserReward (redemption record from reward_redemptions table). */
export type RewardRedemption = UserReward

export interface CompleteEventPayload {
  habit_id: string
  completion_id?: string
  source?: 'app' | 'reminder' | 'offline_sync'
  timestamp?: string
}

export interface UndoEventPayload {
  completion_id: string
}

export interface RedeemRewardPayload {
  reward_id: string
}

export interface AnalyticsEventPayload {
  event_type: string
  user_id?: string
  habit_id?: string
  xp_delta?: number
  new_xp?: number
  level?: number
  streak_length?: number
  badge_id?: string
  reward_id?: string
  event_timestamp?: string
  environment?: string
  device?: string
  app_version?: string
  cohort_id?: string
  [key: string]: unknown
}
