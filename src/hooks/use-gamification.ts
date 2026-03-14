import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gamificationApi } from '@/api/gamification'
import { statsKeys } from './use-stats'
import { habitKeys } from './use-habits'
import { recentCompletionsKeys } from './use-recent-completions'
import { toast } from 'sonner'
import { analytics } from '@/lib/analytics'

export const gamificationKeys = {
  all: ['gamification'] as const,
  profile: (userId: string) => [...gamificationKeys.all, 'profile', userId] as const,
  config: () => [...gamificationKeys.all, 'config'] as const,
  leaderboard: (params: { scope?: string; metric?: string; page?: number }) =>
    [...gamificationKeys.all, 'leaderboard', params] as const,
}

export function useGamificationProfile(userId: string | undefined) {
  return useQuery({
    queryKey: gamificationKeys.profile(userId ?? ''),
    queryFn: () => gamificationApi.getProfile(userId!),
    enabled: !!userId,
  })
}

export function useGamificationConfig() {
  return useQuery({
    queryKey: gamificationKeys.config(),
    queryFn: () => gamificationApi.getConfig(),
  })
}

export function useLeaderboard(params: {
  scope?: string
  metric?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: gamificationKeys.leaderboard(params),
    queryFn: () =>
      gamificationApi.getLeaderboard({
        scope: params.scope ?? 'global',
        metric: params.metric ?? 'xp',
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
      }),
  })
}

export function useRedeemReward(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rewardId: string) => gamificationApi.redeemReward({ reward_id: rewardId }),
    onSuccess: (data, rewardId) => {
      qc.invalidateQueries({ queryKey: gamificationKeys.profile(userId) })
      qc.invalidateQueries({ queryKey: statsKeys.user(userId) })
      const pointsSpent = (data as { points_spent?: number }).points_spent
      if (pointsSpent != null) analytics.rewardRedeemed(rewardId, pointsSpent)
      const rewardName = (data as { reward_name?: string }).reward_name
      toast.success(rewardName ? `Redeemed: ${rewardName}` : 'Reward redeemed!')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUndoCompletion(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (completionId: string) => gamificationApi.undoCompletion({ completion_id: completionId }),
    onSuccess: (_, _completionId) => {
      qc.invalidateQueries({ queryKey: gamificationKeys.profile(userId) })
      qc.invalidateQueries({ queryKey: statsKeys.user(userId) })
      qc.invalidateQueries({ queryKey: habitKeys.list(userId) })
      qc.invalidateQueries({ queryKey: recentCompletionsKeys.user(userId) })
      toast.success('Completion undone')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
