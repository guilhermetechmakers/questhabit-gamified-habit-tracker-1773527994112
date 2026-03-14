import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimatedPage } from '@/components/AnimatedPage'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { logAuthEvent } from '@/api/auth'

const RESEND_COOLDOWN_SEC = 60

export default function EmailVerification() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [verifying, setVerifying] = useState(!!token)
  const [verified, setVerified] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!token) return
    const verify = async () => {
      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email',
        })
        if (error) throw error
        setVerified(true)
        await logAuthEvent('email_verified', { source: 'link' })
        toast.success('Email verified! You can sign in now.')
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Verification failed')
      } finally {
        setVerifying(false)
      }
    }
    verify()
  }, [token])

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return
    setResending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        toast.error('No email found. Please sign in again.')
        return
      }
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      })
      if (error) throw error
      await logAuthEvent('email_verification_sent' as Parameters<typeof logAuthEvent>[0], { resend: true })
      toast.success('Verification email sent. Check your inbox.')
      setResendCooldown(RESEND_COOLDOWN_SEC)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to resend')
    } finally {
      setResending(false)
    }
  }

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  return (
    <AnimatedPage className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#FFF4EA] to-[#F7E1C9] p-4">
      <Card className="w-full max-w-md border-border bg-card shadow-card">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>
            {verifying
              ? 'Verifying…'
              : verified
                ? 'Your email is verified. You can now sign in.'
                : token
                  ? 'We couldn’t verify this link. Try resending the email.'
                  : 'Check your inbox for a verification link, or resend the email.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verifying && (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {!verifying && (
            <>
              <Button
                type="button"
                variant="gradient"
                className="w-full rounded-xl"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resending}
              >
                {resending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  'Resend verification email'
                )}
              </Button>
              <div className="flex flex-col gap-2 text-center text-sm">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 text-muted-foreground underline hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Return to log in
                </Link>
                <Link
                  to="/signup"
                  className="text-muted-foreground underline hover:text-foreground"
                >
                  Use a different email
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </AnimatedPage>
  )
}
