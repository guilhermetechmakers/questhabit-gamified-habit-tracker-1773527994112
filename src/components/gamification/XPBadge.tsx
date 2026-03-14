import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface XPBadgeProps {
  xp: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function XPBadge({ xp, className, size = 'md' }: XPBadgeProps) {
  const sizeClasses = {
    sm: 'text-sm gap-1',
    md: 'text-base gap-1.5',
    lg: 'text-lg gap-2',
  }
  const iconClasses = { sm: 'h-3.5 w-3.5', md: 'h-[18px] w-[18px]', lg: 'h-5 w-5' }
  return (
    <span
      className={cn(
        'inline-flex items-center font-bold text-primary',
        sizeClasses[size],
        className
      )}
      aria-label={`${xp} XP`}
    >
      <Star className={cn('shrink-0', iconClasses[size])} />
      {xp} XP
    </span>
  )
}
