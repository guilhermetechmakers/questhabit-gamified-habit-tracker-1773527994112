import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import { Eye, EyeOff } from 'lucide-react'
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator'
import { edgeApi } from '@/api/edge'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
  display_name: z.string().optional(),
})

type Form = z.infer<typeof schema>

export default function Signup() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) })
  const password = watch('password', '')

  const onSubmit = async (data: Form) => {
    setIsLoading(true)
    try {
      const { data: sessionData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { display_name: data.display_name || undefined } },
      })
      if (error) throw error
      if (sessionData?.user) {
        edgeApi.authAuditLog('signup', { email: sessionData.user.email }).catch(() => {})
      }
      toast.success('Account created! Check your email to verify.')
      navigate('/verify-email')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Sign up failed')
    } finally {
      setIsLoading(false)
    }
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
      toast.error(e instanceof Error ? e.message : `Sign up with ${provider} failed`)
      setOauthLoading(null)
    }
  }

  return (
    <AnimatedPage className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-[#FFF4EA] to-[#F7E1C9]">
      <Card className="w-full max-w-md rounded-2xl shadow-card border-border bg-card/95">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create account</CardTitle>
          <CardDescription>Get started in under a minute</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={!!oauthLoading}
              onClick={() => handleOAuth('google')}
              aria-label="Sign up with Google"
            >
              {oauthLoading === 'google' ? '…' : 'Google'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={!!oauthLoading}
              onClick={() => handleOAuth('apple')}
              aria-label="Sign up with Apple"
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
              <Label htmlFor="display_name">Name (optional)</Label>
              <Input
                id="display_name"
                placeholder="Your name"
                className="mt-1 rounded-xl"
                autoComplete="name"
                aria-label="Display name"
                {...register('display_name')}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  className="rounded-xl pr-10"
                  autoComplete="new-password"
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
              <PasswordStrengthIndicator password={password} className="mt-1" />
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
              {isLoading ? 'Creating account…' : 'Sign up'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium underline hover:no-underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AnimatedPage>
  )
}
