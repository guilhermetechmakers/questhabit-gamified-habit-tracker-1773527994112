import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useAllHabits } from '@/hooks/use-habits'
import { useUpdateHabit, useDeleteHabit, useCreateHabit } from '@/hooks/use-habits'
import { HabitCard } from '@/components/habits/HabitCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnimatedPage } from '@/components/AnimatedPage'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, Plus, Target } from 'lucide-react'
import type { Habit } from '@/types/habit'

export default function HabitList() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const { data: habits = [], isLoading } = useAllHabits(userId)
  const updateHabit = useUpdateHabit(userId)
  const deleteHabit = useDeleteHabit(userId)
  const createHabit = useCreateHabit()

  const [search, setSearch] = useState('')
  const [state, setState] = useState<'active' | 'archived'>('active')
  const [deleteTarget, setDeleteTarget] = useState<Habit | null>(null)

  const filtered = useMemo(() => {
    const list = Array.isArray(habits) ? habits : []
    const byState = state === 'archived' ? list.filter((h) => h.archived) : list.filter((h) => !h.archived)
    if (!search.trim()) return byState
    const q = search.toLowerCase().trim()
    return byState.filter((h) => h.title.toLowerCase().includes(q))
  }, [habits, state, search])

  const handleArchive = (habit: Habit) => {
    updateHabit.mutate({ id: habit.id, updates: { archived: !habit.archived } })
  }

  const handleDuplicate = (habit: Habit) => {
    if (!userId) return
    createHabit.mutate({
      user_id: userId,
      title: `${habit.title} (copy)`,
      icon: habit.icon ?? 'target',
      schedule_json: habit.schedule_json ?? { frequency: 'daily' },
      xp_value: habit.xp_value,
      privacy_flag: habit.privacy_flag,
      description: habit.description ?? undefined,
      goal: habit.goal ?? undefined,
      timezone: habit.timezone ?? undefined,
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    await deleteHabit.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <AnimatedPage>
      <h1 className="text-2xl font-bold text-foreground mb-4">Habits</h1>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search habits"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
            aria-label="Search habits"
          />
        </div>
      </div>

      <Tabs value={state} onValueChange={(v) => setState(v as 'active' | 'archived')} className="mb-6">
        <TabsList className="grid w-full grid-cols-2 rounded-xl">
          <TabsTrigger value="active" className="rounded-lg">Active</TabsTrigger>
          <TabsTrigger value="archived" className="rounded-lg">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

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
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No habits match your search.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((habit, i) => (
            <li
              key={habit.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <HabitCard
                habit={habit}
                showNextDue
                onArchive={handleArchive}
                onDuplicate={handleDuplicate}
                onDelete={(h) => setDeleteTarget(h)}
              />
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete habit</DialogTitle>
            <DialogDescription>
              Remove &quot;{deleteTarget?.title}&quot;? Completions will be lost. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteHabit.isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  )
}
