import { useMutation, useQueryClient } from '@tanstack/react-query'
import { edgeApi } from '@/api/edge'
import { toast } from 'sonner'
import { habitKeys } from './use-habits'
import { statsKeys } from './use-stats'
import { recentCompletionsKeys } from './use-recent-completions'
import { gamificationKeys } from './use-gamification'
import { analytics } from '@/lib/analytics'

export function useMarkComplete(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      habitId,
      source,
      completionId,
    }: {
      habitId: string
      source?: 'app' | 'reminder' | 'offline_sync'
      completionId?: string
    }) => edgeApi.processCompletion(habitId, source ?? 'app', completionId),
    onSuccess: (data, { habitId }) => {
      qc.invalidateQueries({ queryKey: habitKeys.detail(habitId) })
      qc.invalidateQueries({ queryKey: habitKeys.list(userId) })
      qc.invalidateQueries({ queryKey: statsKeys.user(userId) })
      qc.invalidateQueries({ queryKey: recentCompletionsKeys.user(userId) })
      qc.invalidateQueries({ queryKey: gamificationKeys.profile(userId) })
      if (data.already_processed) return
      analytics.habitCompleted(
        habitId,
        data.xp_awarded,
        data.xp_total,
        data.level,
        data.current_streak ?? 0
      )
      if (data.badges_awarded?.length) {
        data.badges_awarded.forEach((id: string) => analytics.badgeEarned(id))
      }
      const msg = data.badges_awarded?.length
        ? `+${data.xp_awarded} XP! Badge earned!`
        : `+${data.xp_awarded} XP!`
      toast.success(msg)
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
