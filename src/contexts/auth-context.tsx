import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { edgeApi } from '@/api/edge'

interface AuthContextValue {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: string | null
  isEmailVerified: boolean
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setUser(s?.user ?? null)
      setSession(s ?? null)
      setIsLoading(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setUser(s?.user ?? null)
      setSession(s ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signOut = useCallback(async () => {
    const uid = user?.id ?? null
    await supabase.auth.signOut()
    if (uid) {
      edgeApi.authAuditLog('logout', { user_id: uid }).catch(() => {})
    }
    setError(null)
  }, [user?.id])

  const clearError = useCallback(() => setError(null), [])

  const isEmailVerified = !!user?.email_confirmed_at

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        error: error ?? null,
        isEmailVerified,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
