import { useMutation, useQueryClient } from '@tanstack/react-query'
import { edgeApi } from '@/api/edge'
import { toast } from 'sonner'
import { habitKeys } from './use-habits'
import { statsKeys } from './use-stats'

export function useMarkComplete(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ habitId, source }: { habitId: string; source?: 'app' | 'reminder' | 'offline_sync' }) =>
      edgeApi.processCompletion(habitId, source ?? 'app'),
    onSuccess: (data, { habitId }) => {
      qc.invalidateQueries({ queryKey: habitKeys.detail(habitId) })
      qc.invalidateQueries({ queryKey: habitKeys.list(userId) })
      qc.invalidateQueries({ queryKey: statsKeys.user(userId) })
      toast.success(`+${data.xp_awarded} XP!`)
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
