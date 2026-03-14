import { useAuth } from '@/contexts/auth-context'

/**
 * Hook for route or component-level auth checks.
 * Returns auth state for conditional rendering or redirects.
 */
export function useProtectedRoute() {
  const { user, isLoading } = useAuth()
  return {
    isAuthenticated: !!user,
    user,
    isLoading,
  }
}
