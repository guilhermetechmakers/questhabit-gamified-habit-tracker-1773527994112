import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '@/api/settings'
import type { UserSettings } from '@/types/settings'
import { toast } from 'sonner'

export const settingsKeys = {
  all: (userId: string) => ['settings', userId] as const,
}

export function useSettings(userId: string | undefined) {
  return useQuery({
    queryKey: settingsKeys.all(userId ?? ''),
    queryFn: () => settingsApi.get(userId!),
    enabled: !!userId,
  })
}

export function useUpdateSettings(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (updates: Partial<UserSettings>) => settingsApi.update(userId, updates),
    onSuccess: (data) => {
      qc.setQueryData(settingsKeys.all(userId), data)
      toast.success('Settings saved')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
