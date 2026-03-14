import { useState } from 'react'
import { Link } from 'react-router-dom'
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
import { Lock, Eye, EyeOff } from 'lucide-react'
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator'
import { edgeApi } from '@/api/edge'

const schema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })

type Form = z.infer<typeof schema>

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) })
  const password = watch('password', '')

  const onSubmit = async (data: Form) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password })
      if (error) throw error
      setSuccess(true)
      toast.success('Password updated. You can sign in now.')
      edgeApi.authAuditLog('password_changed', {}).catch(() => {})
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Update failed')
    }
  }

  if (success) {
    return (
      <AnimatedPage className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-[#FFF4EA] to-[#F7E1C9]">
        <Card className="w-full max-w-md rounded-2xl shadow-card border-border bg-card/95">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Password updated</CardTitle>
            <CardDescription>Your password has been changed. Sign in with your new password.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button variant="gradient" className="w-full rounded-xl">
                Sign in
              </Button>
            </Link>
          </CardContent>
        </Card>
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-[#FFF4EA] to-[#F7E1C9]">
      <Card className="w-full max-w-md rounded-2xl shadow-card border-border bg-card/95">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" aria-hidden />
          </div>
          <CardTitle className="text-2xl">Set new password</CardTitle>
          <CardDescription>
            Enter your new password below. Use at least 8 characters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="password">New password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="rounded-xl pr-10"
                  autoComplete="new-password"
                  aria-label="New password"
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
            <div>
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                className="mt-1 rounded-xl"
                autoComplete="new-password"
                aria-label="Confirm new password"
                {...register('confirm')}
              />
              {errors.confirm && (
                <p className="text-sm text-destructive mt-1">{errors.confirm.message}</p>
              )}
            </div>
            <Button type="submit" variant="gradient" className="w-full rounded-xl">
              Update password
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary underline hover:no-underline">
              Back to log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AnimatedPage>
  )
}
