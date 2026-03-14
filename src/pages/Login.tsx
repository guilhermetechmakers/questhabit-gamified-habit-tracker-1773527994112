import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { AnimatedPage } from '@/components/AnimatedPage'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { edgeApi } from '@/api/edge'
import { authApi } from '@/api/auth'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

type Form = z.infer<typeof schema>

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/app/dashboard'
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Form) => {
    setIsLoading(true)
    try {
      const { data: sessionData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) throw error
      const user = sessionData?.user
      if (user) {
        edgeApi.authAuditLog('login', { email: user.email }).catch(() => {})
        authApi.updateLastLogin(user.id).catch(() => {})
      }
      if (user && !user.email_confirmed_at) {
        toast.success('Signed in. Please verify your email.')
        navigate('/verify-email')
        return
      }
      toast.success('Welcome back!')
      const hasHabits = await checkHasHabits(user?.id)
      navigate(hasHabits ? from : '/app/habits/new', { replace: true })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function checkHasHabits(userId: string | undefined): Promise<boolean> {
    if (!userId) return false
    const { data } = await supabase.from('habits').select('id').eq('user_id', userId).limit(1)
    return Array.isArray(data) && data.length > 0
  }

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/app/dashboard` },
      })
      if (error) throw error
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : `Sign in with ${provider} failed`)
      setOauthLoading(null)
    }
  }

  return (
    <AnimatedPage className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-[#FFF4EA] to-[#F7E1C9]">
      <Card className="w-full max-w-md rounded-2xl shadow-card border-border bg-card/95">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Log in</CardTitle>
          <CardDescription>Enter your email and password or sign in with a provider</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={!!oauthLoading}
              onClick={() => handleOAuth('google')}
              aria-label="Sign in with Google"
            >
              {oauthLoading === 'google' ? '…' : 'Google'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={!!oauthLoading}
              onClick={() => handleOAuth('apple')}
              aria-label="Sign in with Apple"
            >
              {oauthLoading === 'apple' ? '…' : 'Apple'}
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase text-muted-foreground">
              <span className="bg-card px-2">or</span>
            </div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="mt-1 rounded-xl"
                autoComplete="email"
                aria-label="Email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="rounded-xl pr-10"
                  autoComplete="current-password"
                  aria-label="Password"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>
            <Button
              type="submit"
              variant="gradient"
              className="w-full rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Signing in…
                </>
              ) : (
                'Log in'
              )}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-medium underline hover:no-underline">
              Sign up
            </Link>
          </p>
          <p className="text-center text-sm">
            <Link
              to="/forgot-password"
              className="text-muted-foreground underline hover:text-foreground"
            >
              Forgot password?
            </Link>
          </p>
        </CardContent>
      </Card>
    </AnimatedPage>
  )
}
