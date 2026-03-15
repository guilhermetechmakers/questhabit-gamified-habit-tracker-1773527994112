import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useProfile } from '@/hooks/use-profile'

const ADMIN_ROLES = ['admin', 'moderator', 'support', 'auditor'] as const

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const location = useLocation()
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id)

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-label="Loading"
        />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const role = profile?.role ?? ''
  const isAdmin = ADMIN_ROLES.some((r) => r === role)

  if (!isAdmin) {
    return <Navigate to="/app/dashboard" replace />
  }

  return <>{children}</>
}
