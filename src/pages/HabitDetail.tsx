import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useHabitWithReminders, useDeleteHabit } from '@/hooks/use-habits'
import { useMarkComplete } from '@/hooks/use-completion'
import { useCreateReminder, useUpdateReminder, useDeleteReminder } from '@/hooks/use-reminders'
import { useHabitHistory, useHabitAnalytics } from '@/hooks/use-habits'
import { HabitIcon } from '@/components/habits/habit-icon'
import { ReminderEditor, HistoryTimeline } from '@/components/habits'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedPage } from '@/components/AnimatedPage'
import { formatScheduleLabel } from '@/lib/schedule'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useState } from 'react'
import { Star, Pencil, Trash2, ArrowLeft, Bell, Calendar, Award, Target, Gift } from 'lucide-react'
import { StreakIndicator } from '@/components/gamification'
import { format, parseISO } from 'date-fns'

export default function HabitDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const { data: habit, isLoading } = useHabitWithReminders(id)
  const { data: history = [] } = useHabitHistory(id)
  const { data: analytics } = useHabitAnalytics(id)
  const deleteHabit = useDeleteHabit(userId)
  const markComplete = useMarkComplete(userId)
  const createReminder = useCreateReminder(id ?? '')
  const updateReminder = useUpdateReminder(id ?? '')
  const deleteReminder = useDeleteReminder(id ?? '')
  const [showDelete, setShowDelete] = useState(false)

  const handleDelete = async () => {
    if (!id) return
    await deleteHabit.mutateAsync(id)
    setShowDelete(false)
    navigate('/app/habits')
  }

  const reminders = habit?.reminders ?? []

  if (!id) return null
  if (isLoading || !habit) {
    return (
      <AnimatedPage>
        <Skeleton className="h-32 w-full rounded-xl mb-4" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </AnimatedPage>
    )
  }

  const last7 = analytics?.last_7_days ?? []
  const chartData = last7.map((d) => ({
    day: format(parseISO(d.date), 'EEE'),
    completed: d.completed ? 1 : 0,
    xp: d.xp_gained,
  }))

  return (
    <AnimatedPage>
      <div className="flex items-center gap-2 mb-6">
        <Link to="/app/habits">
          <Button variant="ghost" size="icon" aria-label="Back to habits">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground flex-1 truncate">{habit.title}</h1>
        <Link to={`/app/habits/${id}/edit`}>
          <Button variant="ghost" size="icon" aria-label="Edit habit">
            <Pencil className="h-5 w-5" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setShowDelete(true)} aria-label="Delete habit">
          <Trash2 className="h-5 w-5 text-destructive" />
        </Button>
      </div>

      {habit.goal && (
        <p className="text-sm text-muted-foreground mb-4">{habit.goal}</p>
      )}

      <Card className="mb-6">
        <CardContent className="p-6 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HabitIcon name={habit.icon} size={32} />
          </div>
          <Button
            variant="gradient"
            size="lg"
            className="w-full rounded-xl"
            onClick={() => markComplete.mutate({ habitId: id })}
            disabled={markComplete.isPending}
          >
            <Star className="h-5 w-5 mr-2" />
            {markComplete.isPending ? 'Marking…' : 'Mark complete'}
          </Button>
          <p className="text-sm text-muted-foreground">+{habit.xp_value} XP per completion</p>
          <Link to="/app/rewards" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2">
            <Gift className="h-4 w-4" />
            View rewards & badges
          </Link>
        </CardContent>
      </Card>

      {analytics && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Last 7 days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis hide domain={[0, 1]} />
                  <Tooltip
                    formatter={(value: number) => (value ? 'Done' : '—')}
                    contentStyle={{ borderRadius: 8 }}
                  />
                  <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.completed ? 'rgb(var(--primary))' : 'rgb(var(--muted))'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2 flex-wrap">
              <StreakIndicator current={analytics.current_streak} longest={analytics.longest_streak} showLongest />
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        <Link to="/app/rewards">
          <Button variant="outline" size="sm" className="rounded-xl">
            <Award className="h-4 w-4 mr-1" />
            View rewards & badges
          </Button>
        </Link>
        <Link to="/app/challenges">
          <Button variant="outline" size="sm" className="rounded-xl">
            <Target className="h-4 w-4 mr-1" />
            Challenges
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{formatScheduleLabel(habit.schedule_json ?? null)}</p>
          {habit.timezone && (
            <p className="text-xs text-muted-foreground mt-1">Timezone: {habit.timezone}</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReminderEditor
            reminders={reminders}
            onAdd={(timeOfDay: string) => createReminder.mutate({ time_of_day: timeOfDay })}
            onToggle={(rid: string, enabled: boolean) =>
              updateReminder.mutate({ id: rid, updates: { enabled } })
            }
            onRemove={(rid: string) => deleteReminder.mutate(rid)}
          />
        </CardContent>
      </Card>

      {Array.isArray(history) && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent history</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              <HistoryTimeline entries={history} maxItems={10} />
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete habit</DialogTitle>
            <DialogDescription>
              Remove &quot;{habit.title}&quot;? Completions will be lost. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteHabit.isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  )
}
