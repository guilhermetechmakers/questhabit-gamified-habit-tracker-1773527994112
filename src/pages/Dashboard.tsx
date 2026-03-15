import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useOfflineSync } from '@/contexts/offline-sync-context'
import { useHabits } from '@/hooks/use-habits'
import { useUserStats } from '@/hooks/use-stats'
import { useGamificationProfile } from '@/hooks/use-gamification'
import { useMarkComplete } from '@/hooks/use-completion'
import { useRecentCompletions } from '@/hooks/use-recent-completions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { AnimatedPage } from '@/components/AnimatedPage'
import { HabitIcon } from '@/components/habits/habit-icon'
import { LevelBadge, StreakIndicator } from '@/components/gamification'
import { Star, ChevronRight, Activity, Coins, Award, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'

const XP_PER_LEVEL = 100
const LEVEL_MULTIPLIER = 1.2

function xpForLevel(level: number) {
  return Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1))
}

export default function Dashboard() {
  const { user } = useAuth()
  const userId = user?.id
  const { habits: offlineHabits = [], activityLog = [] } = useOfflineSync()
  const { data: serverHabits = [], isLoading: habitsLoading } = useHabits(userId)
  const habits = (offlineHabits?.length ?? 0) > 0 ? offlineHabits : serverHabits
  const { data: stats, isLoading: statsLoading } = useUserStats(userId)
  const { data: profile } = useGamificationProfile(userId)
  const { data: recentCompletions = [] } = useRecentCompletions(userId, 5)
  const markComplete = useMarkComplete(userId ?? '')
  const habitMap = new Map((Array.isArray(habits) ? habits : []).map((h) => [h.id, h]))
  const activityItems = Array.isArray(activityLog) ? activityLog : []

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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <LevelBadge level={level} size="md" />
              <Star className="h-5 w-5 text-primary" />
              <span className="text-xl font-bold text-primary">{xpTotal} XP</span>
            </CardTitle>
            <Link to="/app/rewards" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
              <Coins className="h-4 w-4" />
              {profile?.rewards_points ?? profile?.reward_points ?? stats?.rewards_points ?? 0} pts
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={Math.min(progress, 100)} className="h-2 rounded-full" />
          <p className="text-xs text-muted-foreground mt-2">
            {xpTotal - xpPrev} / {xpCurrentLevel - xpPrev} XP to next level
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <StreakIndicator
          current={stats?.current_streak ?? 0}
          longest={stats?.longest_streak}
          showLongest
        />
        <Link to="/app/leaderboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <Trophy className="h-5 w-5" />
          View rank
        </Link>
        {Array.isArray(profile?.badges) && profile.badges.length > 0 && (
          <Link to="/app/rewards" className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <Award className="h-5 w-5" />
            <span className="text-sm">{profile.badges.length} badges</span>
          </Link>
        )}
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
                      <HabitIcon name={habit.icon} size={24} />
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

      {(activityItems.length > 0 || (Array.isArray(recentCompletions) && recentCompletions.length > 0)) && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Activity timeline
          </h2>
          <Card>
            <CardContent className="p-4">
              {activityItems.length > 0 ? (
                <ul className="space-y-2">
                  {activityItems.slice(0, 10).map((a) => (
                    <li key={a.id} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground truncate mr-2">
                        {a.habitTitle ?? a.type}
                      </span>
                      {typeof (a.payload as Record<string, unknown>)?.xp === 'number' && (
                        <span className="shrink-0 text-foreground font-medium">+{(a.payload as { xp: number }).xp} XP</span>
                      )}
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {format(parseISO(a.timestamp), 'HH:mm')}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="space-y-2">
                  {(recentCompletions ?? []).slice(0, 5).map((c) => {
                    const habit = habitMap.get(c.habit_id)
                    const title = habit?.title ?? 'Habit'
                    return (
                      <li key={c.id} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground truncate mr-2">{title}</span>
                        <span className="shrink-0 text-foreground font-medium">+{c.xp_awarded} XP</span>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          {format(parseISO(c.timestamp), 'HH:mm')}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      )}
    </AnimatedPage>
  )
}
