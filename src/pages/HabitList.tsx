import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useOfflineSync } from '@/contexts/offline-sync-context'
import { useAllHabits, useUpdateHabit, useDeleteHabit, useCreateHabit } from '@/hooks/use-habits'
import { HabitCard, FiltersPanel } from '@/components/habits'
import type { HabitStatusFilter } from '@/components/habits/FiltersPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedPage } from '@/components/AnimatedPage'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Target } from 'lucide-react'
import type { Habit } from '@/types/habit'
import type { HabitWithLocal } from '@/types/offline'

export default function HabitList() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const { habits: offlineHabits = [], conflicts = [], refresh } = useOfflineSync()
  const { data: serverHabits = [], isLoading } = useAllHabits(userId)
  const updateHabit = useUpdateHabit(userId)
  const deleteHabit = useDeleteHabit(userId)
  const createHabit = useCreateHabit()

  const habits: HabitWithLocal[] =
    (offlineHabits?.length ?? 0) > 0 ? offlineHabits : (serverHabits as HabitWithLocal[])
  const conflictIds = useMemo(
    () => new Set((conflicts ?? []).map((c) => c.entityId)),
    [conflicts]
  )

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<HabitStatusFilter>('active')
  const [deleteTarget, setDeleteTarget] = useState<Habit | null>(null)

  const filtered = useMemo(() => {
    const list = Array.isArray(habits) ? habits : []
    const byStatus =
      statusFilter === 'all'
        ? list
        : statusFilter === 'archived'
          ? list.filter((h) => h?.archived)
          : statusFilter === 'template'
            ? list.filter((h) => (h as { type?: string }).type === 'template')
            : list.filter((h) => !h?.archived)
    if (!search.trim()) return byStatus
    const q = search.toLowerCase().trim()
    return byStatus.filter((h) => h?.title?.toLowerCase().includes(q))
  }, [habits, statusFilter, search])

  const handleArchive = (habit: Habit) => {
    updateHabit.mutate(
      { id: habit.id, updates: { archived: !habit.archived } },
      { onSettled: () => refresh() }
    )
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
    refresh()
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    await deleteHabit.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
    refresh()
  }

  return (
    <AnimatedPage>
      <h1 className="text-2xl font-bold text-foreground mb-4">Habits</h1>

      <FiltersPanel
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        className="mb-6"
      />

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
                syncStatus={
                  conflictIds.has(habit.id)
                    ? 'conflict'
                    : habit._local?.pendingSync
                      ? 'pending'
                      : undefined
                }
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
