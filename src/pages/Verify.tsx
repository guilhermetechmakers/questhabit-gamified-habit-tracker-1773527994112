import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimatedPage } from '@/components/AnimatedPage'
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { verifyEmailToken } from '@/api/verification'
import { toast } from 'sonner'

export default function Verify() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')?.trim() ?? ''
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage('Invalid or missing verification link.')
      return
    }

    let cancelled = false
    setState('loading')

    verifyEmailToken(token)
      .then((res) => {
        if (cancelled) return
        if (res.success) {
          setState('success')
          setMessage(res.message ?? 'Email verified successfully.')
          toast.success('Email verified!')
          setTimeout(() => {
            if (cancelled) return
            navigate('/app/dashboard', { replace: true })
          }, 1500)
        } else {
          setState('error')
          setMessage(res.error ?? 'Verification failed.')
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setState('error')
        setMessage(e instanceof Error ? e.message : 'Verification failed.')
      })

    return () => {
      cancelled = true
    }
  }, [token, navigate])

  return (
    <AnimatedPage className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-[#FFF4EA] to-[#F7E1C9]">
      <Card className="w-full max-w-md rounded-2xl shadow-[0_8px_20px_rgba(15,17,36,0.06)] border-border bg-card/95">
        <CardHeader className="text-center">
          {state === 'loading' && (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
            </div>
          )}
          {state === 'success' && (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--success))]/20">
              <CheckCircle2 className="h-6 w-6 text-[rgb(var(--success))]" aria-hidden />
            </div>
          )}
          {state === 'error' && (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" aria-hidden />
            </div>
          )}
          <CardTitle className="text-2xl font-semibold">
            {state === 'loading' && 'Verifying…'}
            {state === 'success' && 'Email verified'}
            {state === 'error' && 'Verification failed'}
            {state === 'idle' && 'Verifying…'}
          </CardTitle>
          <CardDescription>
            {state === 'loading' && 'Please wait while we verify your email.'}
            {state === 'success' && message}
            {state === 'error' && message}
            {state === 'idle' && 'Please wait.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {state === 'success' && (
            <p className="text-center text-sm text-muted-foreground">
              Redirecting you to continue…
            </p>
          )}
          {state === 'error' && (
            <div className="flex flex-col gap-2">
              <Button
                asChild
                variant="gradient"
                className="w-full rounded-xl"
              >
                <Link to="/verify-email">
                  Back to verification
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full rounded-xl" size="sm">
                <Link to="/login">Go to log in</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AnimatedPage>
  )
}
