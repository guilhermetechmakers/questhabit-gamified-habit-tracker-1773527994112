import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useLeaderboard } from '@/hooks/use-gamification'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AnimatedPage } from '@/components/AnimatedPage'
import { Trophy, Medal, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const METRICS = [
  { value: 'xp', label: 'XP' },
  { value: 'streak', label: 'Streak' },
] as const

export default function Leaderboard() {
  const { user } = useAuth()
  const [metric, setMetric] = useState<'xp' | 'streak'>('xp')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useLeaderboard({
    scope: 'global',
    metric,
    page,
    pageSize: 20,
  })

  const entries = Array.isArray(data?.entries) ? data.entries : []
  const total = data?.total ?? 0
  const pageSize = data?.page_size ?? 20
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <AnimatedPage>
      <h1 className="text-2xl font-bold text-foreground mb-2">Leaderboard</h1>
      <p className="text-muted-foreground text-sm mb-6">
        See how you rank. Complete habits to climb.
      </p>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Top players
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {METRICS.map((m) => (
              <Button
                key={m.value}
                variant={metric === m.value ? 'default' : 'outline'}
                size="sm"
                className="rounded-xl"
                onClick={() => { setMetric(m.value); setPage(1) }}
              >
                {m.label}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Medal className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No entries yet. Be the first to complete habits!</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {entries.map((entry) => {
                const isCurrentUser = entry.user_id === user?.id
                return (
                  <li
                    key={entry.user_id}
                    className={cn(
                      'flex items-center gap-3 rounded-xl p-3 transition-colors',
                      isCurrentUser && 'bg-primary/10 ring-1 ring-primary/30'
                    )}
                  >
                    <span className="text-lg font-bold text-muted-foreground w-8 shrink-0">
                      {entry.rank}
                    </span>
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {entry.avatar_url ? (
                        <img src={entry.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-medium truncate',
                        isCurrentUser ? 'text-primary' : 'text-foreground'
                      )}>
                        {entry.display_name ?? 'Anonymous'}
                        {isCurrentUser && ' (you)'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Level {entry.level}
                        {metric === 'xp' && ` · ${entry.xp_total} XP`}
                        {metric === 'streak' && ` · ${entry.current_streak} day streak`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {metric === 'xp' && (
                        <span className="font-bold text-primary">{entry.xp_total}</span>
                      )}
                      {metric === 'streak' && (
                        <span className="font-bold text-primary">{entry.current_streak}</span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AnimatedPage>
  )
}
