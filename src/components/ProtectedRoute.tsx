import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const pathname = location.pathname ?? ''
  const isVerifyRoute = pathname === '/verify-email' || pathname === '/verify'
  if (!user.email_confirmed_at && !isVerifyRoute) {
    return <Navigate to="/verify-email" replace />
  }

  return <>{children}</>;
}
