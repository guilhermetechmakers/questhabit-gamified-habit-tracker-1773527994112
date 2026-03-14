import { useMemo } from 'react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong'

function getStrength(password: string): { level: PasswordStrength; score: number } {
  if (!password || password.length === 0) {
    return { level: 'weak', score: 0 }
  }
  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  const level: PasswordStrength =
    score <= 1 ? 'weak' : score === 2 ? 'fair' : score === 3 ? 'good' : 'strong'
  return { level, score: (score / 5) * 100 }
}

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const { level, score } = useMemo(() => getStrength(password), [password])

  if (!password) return null

  const label =
    level === 'weak'
      ? 'Weak'
      : level === 'fair'
        ? 'Fair'
        : level === 'good'
          ? 'Good'
          : 'Strong'
  return (
    <div className={cn('space-y-1', className)}>
      <Progress value={score} className="h-1.5" />
      <p
        className={cn(
          'text-xs font-medium',
          level === 'weak' && 'text-destructive',
          level === 'fair' && 'text-amber-600',
          level === 'good' && 'text-primary',
          level === 'strong' && 'text-success'
        )}
      >
        {label}
      </p>
    </div>
  )
}
