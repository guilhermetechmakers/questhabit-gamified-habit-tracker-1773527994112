import { useMemo } from 'react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

const MIN_LENGTH = 8
const WEAK_LEN = 8
const MEDIUM_LEN = 10

function getStrength(password: string): { score: number; label: string } {
  if (!password.length) return { score: 0, label: '' }
  let score = 0
  if (password.length >= MIN_LENGTH) score += 1
  if (password.length >= MEDIUM_LEN) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  const normalized = Math.min(score, 4)
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  return { score: (normalized / 4) * 100, label: labels[normalized] }
}

export function PasswordStrengthIndicator({
  password,
  className,
}: {
  password: string
  className?: string
}) {
  const { score, label } = useMemo(() => getStrength(password ?? ''), [password])

  if (!password?.length) return null

  return (
    <div className={cn('space-y-1', className)}>
      <Progress value={score} className="h-1.5" />
      <p
        className={cn(
          'text-xs font-medium',
          score < 33 && 'text-destructive',
          score >= 33 && score < 66 && 'text-amber-600',
          score >= 66 && 'text-success'
        )}
      >
        {label}
        {password.length > 0 && password.length < MIN_LENGTH && (
          <span className="text-muted-foreground ml-1">
            (min {MIN_LENGTH} characters)
          </span>
        )}
      </p>
    </div>
  )
}
