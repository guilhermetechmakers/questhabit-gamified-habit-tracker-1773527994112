import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StreakIndicatorProps {
  current: number
  longest?: number
  className?: string
  showLongest?: boolean
}

export function StreakIndicator({ current, longest, className, showLongest = false }: StreakIndicatorProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 text-foreground', className)}
      aria-label={`Current streak: ${current} days${longest != null ? `; Longest: ${longest} days` : ''}`}
    >
      <Flame className="h-5 w-5 text-primary shrink-0" aria-hidden />
      <span className="font-semibold">{current}</span>
      <span className="text-muted-foreground text-sm">day{current !== 1 ? 's' : ''}</span>
      {showLongest && longest != null && (
        <>
          <span className="text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground">best {longest}</span>
        </>
      )}
    </span>
  )
}
