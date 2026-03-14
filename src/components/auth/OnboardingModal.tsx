import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Target } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useHabits } from '@/hooks/use-habits'

const STORAGE_KEY = 'questhabit_onboarding_dismissed'

export function OnboardingModal() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: habits = [], isLoading } = useHabits(user?.id)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user || isLoading) return
    const dismissed = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(STORAGE_KEY) : null
    if (habits.length === 0 && !dismissed) {
      setOpen(true)
    }
  }, [user, habits.length, isLoading])

  const handleCreate = () => {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(STORAGE_KEY, '1')
    setOpen(false)
    navigate('/app/habits/new')
  }

  const handleLater = () => {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(STORAGE_KEY, '1')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleLater()}>
      <DialogContent showClose={true} className="rounded-2xl shadow-card">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Target className="h-6 w-6 text-primary" aria-hidden />
          </div>
          <DialogTitle className="text-center text-xl">Create your first habit</DialogTitle>
          <DialogDescription className="text-center">
            Start your quest in under 30 seconds. Pick a habit, set your schedule, and earn XP with
            every completion.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          <Button variant="gradient" className="rounded-xl w-full" onClick={handleCreate}>
            Create first habit
          </Button>
          <Button variant="ghost" className="rounded-xl w-full" onClick={handleLater}>
            Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
