import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Star, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

const XP_PER_LEVEL = 100
const LEVEL_MULTIPLIER = 1.2

function xpForLevel(level: number): number {
  return Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1))
}

export interface ImpactPreviewProps {
  currentXp?: number
  currentLevel?: number
  currentStreak?: number
  xpPerCompletion?: number
  completionsPerWeek?: number
  className?: string
}

export function ImpactPreview({
  currentXp = 0,
  currentLevel = 1,
  currentStreak = 0,
  xpPerCompletion = 10,
  completionsPerWeek = 7,
  className,
}: ImpactPreviewProps) {
  const xpPrev = currentLevel === 1 ? 0 : xpForLevel(currentLevel - 1)
  const xpCurrentLevel = xpForLevel(currentLevel)
  const progress = xpCurrentLevel > xpPrev
    ? ((currentXp - xpPrev) / (xpCurrentLevel - xpPrev)) * 100
    : 0
  const weeklyGain = xpPerCompletion * completionsPerWeek

  return (
    <Card className={cn('bg-card border-border', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          Impact preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Level {currentLevel} progress</span>
            <span className="font-medium">{currentXp} / {xpCurrentLevel} XP</span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-2 rounded-full" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Flame className="h-4 w-4 text-primary" />
          <span>
            Current streak: <strong>{currentStreak}</strong> days
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          At +{xpPerCompletion} XP per completion, {completionsPerWeek}×/week ≈ +{weeklyGain} XP/week.
        </p>
      </CardContent>
    </Card>
  )
}
