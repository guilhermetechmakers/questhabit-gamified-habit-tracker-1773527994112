import { useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'

export interface UseProtectedRouteReturn {
  isAuthenticated: boolean
  isLoading: boolean
  redirectPath: string
  from: ReturnType<typeof useLocation>['state'] extends { from?: { pathname?: string } } ? { pathname: string } | null : null
}

/**
 * Hook for route protection. Use with ProtectedRoute component or to guard content.
 * Returns auth state and redirect path for unauthenticated users.
 */
export function useProtectedRoute(): UseProtectedRouteReturn {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  const from = location.state && typeof location.state === 'object' && 'from' in location.state
    ? (location.state as { from?: { pathname?: string } }).from ?? null
    : null

  return {
    isAuthenticated: !!user,
    isLoading,
    redirectPath: '/login',
    from: from?.pathname ? { pathname: from.pathname } : null,
  }
}
