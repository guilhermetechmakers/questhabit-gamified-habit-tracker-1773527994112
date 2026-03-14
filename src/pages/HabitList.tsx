import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useHabits } from '@/hooks/use-habits'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedPage } from '@/components/AnimatedPage'
import { Search, Plus, Target } from 'lucide-react'
import type { Habit } from '@/types/habit'

export default function HabitList() {
  const { user } = useAuth()
  const userId = user?.id
  const { data: habits, isLoading } = useHabits(userId)
  const [search, setSearch] = useState('')

  const filtered =
    habits?.filter(
      (h) =>
        h.title.toLowerCase().includes(search.toLowerCase())
    ) ?? []

  return (
    <AnimatedPage>
      <h1 className="text-2xl font-bold text-foreground mb-4">Habits</h1>
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search habits"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : !habits?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">No habits yet. Add your first quest!</p>
            <Link to="/app/habits/new">
              <Button variant="gradient" className="rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Create habit
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((habit: Habit) => (
            <li key={habit.id}>
              <Link to={`/app/habits/${habit.id}`}>
                <Card className="transition-all hover:shadow-card-hover hover:-translate-y-0.5">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Target className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{habit.title}</p>
                      <p className="text-sm text-muted-foreground">+{habit.xp_value} XP · {habit.schedule_json?.frequency ?? 'daily'}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AnimatedPage>
  )
}
