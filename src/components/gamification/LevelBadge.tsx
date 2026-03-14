import { cn } from '@/lib/utils'

export interface LevelBadgeProps {
  level: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LevelBadge({ level, className, size = 'md' }: LevelBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 rounded-lg',
    md: 'text-sm px-2.5 py-1 rounded-xl',
    lg: 'text-base px-3 py-1.5 rounded-xl',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold bg-primary/15 text-primary border border-primary/30',
        sizeClasses[size],
        className
      )}
      aria-label={`Level ${level}`}
    >
      Lv.{level}
    </span>
  )
}
