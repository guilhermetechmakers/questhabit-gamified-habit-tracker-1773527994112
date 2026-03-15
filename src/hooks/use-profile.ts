import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/api/auth'

const PROFILE_KEY = ['profile'] as const

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: [...PROFILE_KEY, userId ?? ''],
    queryFn: () => authApi.getMe(userId!),
    enabled: !!userId,
  })
}
