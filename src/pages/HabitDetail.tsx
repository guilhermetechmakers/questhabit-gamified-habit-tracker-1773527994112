import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { useHabit } from '@/hooks/use-habits'
import { useDeleteHabit } from '@/hooks/use-habits'
import { useMarkComplete } from '@/hooks/use-completion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedPage } from '@/components/AnimatedPage'
import { Target, Star, Pencil, Trash2, ArrowLeft } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useState } from 'react'

export default function HabitDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id
  const { data: habit, isLoading } = useHabit(id)
  const deleteHabit = useDeleteHabit(userId ?? '')
  const markComplete = useMarkComplete(userId ?? '')
  const [showDelete, setShowDelete] = useState(false)

  const handleDelete = async () => {
    if (!id) return
    await deleteHabit.mutateAsync(id)
    setShowDelete(false)
    navigate('/app/habits')
  }

  if (!id) return null
  if (isLoading || !habit) {
    return (
      <AnimatedPage>
        <Skeleton className="h-32 w-full rounded-xl mb-4" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <div className="flex items-center gap-2 mb-6">
        <Link to="/app/habits">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground flex-1 truncate">{habit.title}</h1>
        <Link to={`/app/habits/${id}/edit`}>
          <Button variant="ghost" size="icon">
            <Pencil className="h-5 w-5" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setShowDelete(true)}>
          <Trash2 className="h-5 w-5 text-destructive" />
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Target className="h-8 w-8" />
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground capitalize">{habit.schedule_json?.frequency ?? 'daily'}</p>
        </CardContent>
      </Card>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete habit</DialogTitle>
            <DialogDescription>
              Remove "{habit.title}"? Completions will be lost. This can't be undone.
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
