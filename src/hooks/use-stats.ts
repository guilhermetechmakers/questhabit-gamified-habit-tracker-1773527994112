import { useQuery, useQueryClient } from '@tanstack/react-query'
import { statsApi } from '@/api/stats'

export const statsKeys = {
  all: ['stats'] as const,
  user: (userId: string) => [...statsKeys.all, userId] as const,
}

export function useUserStats(userId: string | undefined) {
  return useQuery({
    queryKey: statsKeys.user(userId ?? ''),
    queryFn: () => statsApi.getByUser(userId!),
    enabled: !!userId,
  })
}

export function useInvalidateStats() {
  const qc = useQueryClient()
  return (userId: string) => qc.invalidateQueries({ queryKey: statsKeys.user(userId) })
}
