import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useHabits } from '@/hooks/use-habits'
import { useUserStats } from '@/hooks/use-stats'
import { useMarkComplete } from '@/hooks/use-completion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { AnimatedPage } from '@/components/AnimatedPage'
import { Flame, Star, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const XP_PER_LEVEL = 100
const LEVEL_MULTIPLIER = 1.2

function xpForLevel(level: number) {
  return Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1))
}

export default function Dashboard() {
  const { user } = useAuth()
  const userId = user?.id
  const { data: habits, isLoading: habitsLoading } = useHabits(userId)
  const { data: stats, isLoading: statsLoading } = useUserStats(userId)
  const markComplete = useMarkComplete(userId ?? '')

  if (!userId) return null

  const isLoading = habitsLoading || statsLoading
  const level = stats?.level ?? 1
  const xpTotal = stats?.xp_total ?? 0
  const xpPrev = level === 1 ? 0 : xpForLevel(level - 1)
  const xpCurrentLevel = xpForLevel(level)
  const progress = ((xpTotal - xpPrev) / (xpCurrentLevel - xpPrev)) * 100

  return (
    <AnimatedPage>
      <h1 className="text-2xl font-bold text-foreground mb-6">Today</h1>

      <Card className="mb-6 bg-dark-card text-card-foreground border-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Level {level}
            </CardTitle>
            <span className="text-2xl font-bold text-primary">{xpTotal} XP</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={Math.min(progress, 100)} className="h-2 rounded-full" />
          <p className="text-xs text-muted-foreground mt-2">
            {xpTotal - xpPrev} / {xpCurrentLevel - xpPrev} XP to next level
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 mb-4">
        <Flame className="h-5 w-5 text-primary" />
        <span className="font-medium">Current streak: {stats?.current_streak ?? 0} days</span>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Today's habits</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : !habits?.length ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <p className="mb-4">No habits yet. Create your first quest!</p>
              <Link to="/app/habits/new">
                <Button variant="gradient" className="rounded-xl">Create habit</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {habits.map((habit, i) => (
              <li
                key={habit.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-4 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => markComplete.mutate({ habitId: habit.id })}
                      disabled={markComplete.isPending}
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-primary bg-primary/10 text-primary transition-all hover:scale-105 active:scale-95',
                        markComplete.isPending && 'opacity-50'
                      )}
                      aria-label={`Mark ${habit.title} complete`}
                    >
                      <Star className="h-6 w-6" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{habit.title}</p>
                      <p className="text-sm text-muted-foreground">+{habit.xp_value} XP</p>
                    </div>
                    <Link to={`/app/habits/${habit.id}`}>
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AnimatedPage>
  )
}
