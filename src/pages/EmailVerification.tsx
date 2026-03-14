import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { AnimatedPage } from '@/components/AnimatedPage'
import { Mail, ArrowLeft, RefreshCw, Loader2, Pencil, CheckCircle2 } from 'lucide-react'
import {
  getVerifyStatus,
  resendVerificationEmail,
  updateEmailAndResend,
} from '@/api/verification'
import type { VerifyStatusData } from '@/types/verification'

const POLL_INTERVAL_MS = 15_000
const POLL_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes
const DEFAULT_COOLDOWN_SEC = 60

const changeEmailSchema = z.object({
  newEmail: z.string().email('Enter a valid email address'),
})
type ChangeEmailForm = z.infer<typeof changeEmailSchema>

export default function EmailVerification() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<VerifyStatusData>({ verified: false, email: '' })
  const [statusLoading, setStatusLoading] = useState(true)
  const [isResending, setIsResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [changeEmailOpen, setChangeEmailOpen] = useState(false)
  const [changeEmailSubmitting, setChangeEmailSubmitting] = useState(false)
  const pollUntilRef = useRef<number>(0)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const data = await getVerifyStatus()
      setStatus({ verified: !!data?.verified, email: data?.email ?? '' })
      return data?.verified ?? false
    } catch {
      setStatus((prev) => ({ ...prev, verified: false }))
      return false
    } finally {
      setStatusLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    pollUntilRef.current = Date.now() + POLL_TIMEOUT_MS

    const poll = async () => {
      if (cancelled) return
      const verified = await fetchStatus()
      if (cancelled || verified) return
      if (Date.now() >= pollUntilRef.current) return
      pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
    }

    poll()
    return () => {
      cancelled = true
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
    }
  }, [fetchStatus])

  useEffect(() => {
    if (!status.verified) return
    toast.success('Email verified! Redirecting…')
    navigate('/app/dashboard', { replace: true })
  }, [status.verified, navigate])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return
    setIsResending(true)
    try {
      const { cooldownSeconds } = await resendVerificationEmail()
      setCooldown(cooldownSeconds ?? DEFAULT_COOLDOWN_SEC)
      toast.success('Verification email sent. Check your inbox.')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to resend'
      toast.error(msg)
      setCooldown(DEFAULT_COOLDOWN_SEC)
    } finally {
      setIsResending(false)
    }
  }

  const onChangeEmailSubmit = async (data: ChangeEmailForm) => {
    setChangeEmailSubmitting(true)
    try {
      await updateEmailAndResend(data.newEmail)
      setStatus((prev) => ({ ...prev, email: data.newEmail }))
      setChangeEmailOpen(false)
      toast.success('Email updated. A new verification link was sent.')
      setCooldown(DEFAULT_COOLDOWN_SEC)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update email')
    } finally {
      setChangeEmailSubmitting(false)
    }
  }

  const email = status?.email ?? ''

  return (
    <AnimatedPage className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-[#FFF4EA] to-[#F7E1C9]">
      <Card className="w-full max-w-md rounded-2xl shadow-[0_8px_20px_rgba(15,17,36,0.06)] border-border bg-card/95">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {status.verified ? (
              <CheckCircle2 className="h-6 w-6 text-[rgb(var(--success))]" aria-hidden />
            ) : (
              <Mail className="h-6 w-6 text-primary" aria-hidden />
            )}
          </div>
          <CardTitle className="text-2xl font-semibold">
            {status.verified ? 'Email verified' : 'Verify your email'}
          </CardTitle>
          <CardDescription>
            {statusLoading
              ? 'Checking…'
              : status.verified
                ? 'Your email is verified. Redirecting…'
                : 'We sent a verification link to your email. Click the link to activate your account.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!statusLoading && !status.verified && (
            <>
              {email && (
                <p className="text-center text-sm text-muted-foreground" aria-label="Current email">
                  {email}
                </p>
              )}
              <Button
                variant="gradient"
                className="w-full rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
                onClick={handleResend}
                disabled={isResending || cooldown > 0}
                aria-label={cooldown > 0 ? `Resend available in ${cooldown} seconds` : 'Resend verification email'}
              >
                {cooldown > 0 ? (
                  `Resend in ${cooldown}s`
                ) : (
                  <>
                    <RefreshCw
                      className={isResending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
                      aria-hidden
                    />
                    Resend verification email
                  </>
                )}
              </Button>
              <div className="flex flex-col gap-2 text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setChangeEmailOpen(true)}
                  aria-label="Change email address"
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                  Change email address
                </Button>
                <Link
                  to="/login"
                  className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Return to log in
                </Link>
                <p className="text-xs text-muted-foreground">
                  Wrong email? Update it above or sign out and sign up again with the correct address.
                </p>
              </div>
            </>
          )}
          {statusLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
            </div>
          )}
        </CardContent>
      </Card>

      <ChangeEmailDialog
        open={changeEmailOpen}
        onOpenChange={setChangeEmailOpen}
        onSubmit={onChangeEmailSubmit}
        isSubmitting={changeEmailSubmitting}
      />
    </AnimatedPage>
  )
}

function ChangeEmailDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ChangeEmailForm) => Promise<void>
  isSubmitting: boolean
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangeEmailForm>({ resolver: zodResolver(changeEmailSchema) })

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showClose={true}
        className="rounded-2xl shadow-[0_8px_20px_rgba(15,17,36,0.06)]"
        aria-describedby="change-email-desc"
      >
        <DialogHeader>
          <DialogTitle>Change email address</DialogTitle>
          <DialogDescription id="change-email-desc">
            Enter your new email. We'll send a new verification link to that address.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-4 pt-2">
          <div>
            <Label htmlFor="newEmail">New email</Label>
            <Input
              id="newEmail"
              type="email"
              placeholder="you@example.com"
              className="mt-1 rounded-xl"
              autoComplete="email"
              aria-invalid={!!errors.newEmail}
              aria-describedby={errors.newEmail ? 'newEmail-error' : undefined}
              {...register('newEmail')}
            />
            {errors.newEmail && (
              <p id="newEmail-error" className="text-sm text-destructive mt-1">
                {errors.newEmail.message}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl flex-1"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              className="rounded-xl flex-1 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Updating…
                </>
              ) : (
                'Update & resend'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
