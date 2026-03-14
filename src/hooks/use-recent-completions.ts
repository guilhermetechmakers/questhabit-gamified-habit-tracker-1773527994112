import { useQuery } from '@tanstack/react-query'
import { completionsApi } from '@/api/completions'

export const recentCompletionsKeys = {
  all: ['recentCompletions'] as const,
  user: (userId: string) => [...recentCompletionsKeys.all, userId] as const,
}

export function useRecentCompletions(userId: string | undefined, limit = 5) {
  return useQuery({
    queryKey: [...recentCompletionsKeys.user(userId ?? ''), limit],
    queryFn: () => completionsApi.getByUser(userId!, undefined, undefined, limit),
    enabled: !!userId,
  })
}
