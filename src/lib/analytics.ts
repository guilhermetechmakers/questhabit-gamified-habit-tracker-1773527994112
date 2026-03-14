/**
 * Analytics adapter: fire-and-forget events to Edge Function (Amplitude/GA/Mixpanel).
 * Never blocks; never throws.
 */
import { gamificationApi } from '@/api/gamification'

export const analytics = {
  track: (eventType: string, properties?: Record<string, unknown>): void => {
    const safeProps: Record<string, unknown> = {}
    if (properties && typeof properties === 'object') {
      for (const [k, v] of Object.entries(properties)) {
        if (v !== undefined && v !== null) safeProps[k] = v
      }
    }
    gamificationApi.trackEvent(eventType, Object.keys(safeProps).length > 0 ? safeProps : undefined).catch(() => {})
  },

  habitCompleted: (habitId: string, xpAwarded: number, newXp: number, level: number, streakLength: number) => {
    analytics.track('Habit Completed', {
      habit_id: habitId,
      xp_delta: xpAwarded,
      new_xp: newXp,
      level,
      streak_length: streakLength,
    })
  },

  levelUp: (level: number, totalXp: number) => {
    analytics.track('Level Up', { level, total_xp: totalXp })
  },

  badgeEarned: (badgeId: string, badgeName?: string) => {
    analytics.track('Badge Earned', { badge_id: badgeId, badge_name: badgeName })
  },

  rewardRedeemed: (rewardId: string, pointsSpent: number) => {
    analytics.track('Reward Redeemed', { reward_id: rewardId, points_spent: pointsSpent })
  },

  challengeJoined: (challengeId: string) => {
    analytics.track('Challenge Joined', { challenge_id: challengeId })
  },

  challengeCompleted: (challengeId: string) => {
    analytics.track('Challenge Completed', { challenge_id: challengeId })
  },
}
