import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { AnimatedPage } from '@/components/AnimatedPage'
import { Mail, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react'
import { edgeApi } from '@/api/edge'

const RESEND_COOLDOWN_SEC = 60

export default function EmailVerification() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [verifying, setVerifying] = useState(!!token)
  const [verified, setVerified] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

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
        edgeApi.authAuditLog('email_verified', { source: 'link' }).catch(() => {})
        toast.success('Email verified! You can sign in now.')
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Verification failed')
      } finally {
        setVerifying(false)
      }
    }
    verify()
  }, [token])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return
    setIsResending(true)
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
      edgeApi.authAuditLog('email_verification_sent', { resend: true }).catch(() => {})
      toast.success('Verification email sent. Check your inbox.')
      setCooldown(RESEND_COOLDOWN_SEC)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to resend')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AnimatedPage className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-[#FFF4EA] to-[#F7E1C9]">
      <Card className="w-full max-w-md rounded-2xl shadow-card border-border bg-card/95">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" aria-hidden />
          </div>
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>
            {verifying
              ? 'Verifying…'
              : verified
                ? 'Your email is verified. You can now sign in.'
                : 'We sent a verification link to your email. Click the link to activate your account.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verifying && (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
            </div>
          )}
          {!verifying && (
          <>
          <Button
            variant="gradient"
            className="w-full rounded-xl"
            onClick={handleResend}
            disabled={isResending || cooldown > 0}
          >
            {cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              <>
                <RefreshCw className={isResending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} aria-hidden />
                Resend verification email
              </>
            )}
          </Button>
          <div className="flex flex-col gap-2 text-center">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Return to log in
            </Link>
            <p className="text-xs text-muted-foreground">
              Wrong email? Sign out and sign up again with the correct address.
            </p>
            <Link to="/signup" className="text-sm text-muted-foreground underline hover:text-foreground">
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
