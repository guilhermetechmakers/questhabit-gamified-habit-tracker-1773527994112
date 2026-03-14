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
import { Mail, ArrowLeft } from 'lucide-react'
import { edgeApi } from '@/api/edge'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

type Form = z.infer<typeof schema>

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: Form) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSubmitted(true)
      toast.success('Check your email for the reset link.')
      edgeApi.authAuditLog('password_reset_requested', { email: data.email }).catch(() => {})
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Request failed')
    }
  }

  if (submitted) {
    return (
      <AnimatedPage className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-[#FFF4EA] to-[#F7E1C9]">
        <Card className="w-full max-w-md rounded-2xl shadow-card border-border bg-card/95">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
              <Mail className="h-6 w-6 text-success" aria-hidden />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We sent a password reset link to <strong>{getValues('email')}</strong>. Click the link
              to set a new password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full rounded-xl" asChild>
              <Link to="/login" className="inline-flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back to log in
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-[#FFF4EA] to-[#F7E1C9]">
      <Card className="w-full max-w-md rounded-2xl shadow-card border-border bg-card/95">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>
            Enter your email and we’ll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="mt-1 rounded-xl"
                autoComplete="email"
                aria-label="Email address"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>
            <Button type="submit" variant="gradient" className="w-full rounded-xl">
              Send reset link
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
