import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Target,
  ChevronRight,
  Flame,
  Archive,
  Pencil,
  Trash2,
  MoreHorizontal,
  CloudOff,
  AlertCircle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Habit } from '@/types/habit'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  target: Target,
  dumbbell: Target,
  book: Target,
  droplets: Target,
  moon: Target,
  sun: Target,
  coffee: Target,
  heart: Target,
}

export interface HabitCardProps {
  habit: Habit
  showActions?: boolean
  showNextDue?: boolean
  onArchive?: (habit: Habit) => void
  onDelete?: (habit: Habit) => void
  onDuplicate?: (habit: Habit) => void
  onQuickComplete?: (habitId: string) => void
  compact?: boolean
  streak?: number
  /** Sync state: pending, conflict, or undefined when synced */
  syncStatus?: 'pending' | 'conflict' | 'synced'
}

export function HabitCard({
  habit,
  showActions = true,
  onArchive,
  onDelete,
  onDuplicate,
  onQuickComplete,
  compact = false,
  streak = 0,
  syncStatus,
}: HabitCardProps) {
  const Icon = ICON_MAP[habit.icon] ?? Target
  const frequency = habit.schedule_json?.frequency ?? 'daily'

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5',
        compact && 'shadow-card'
      )}
    >
      <CardContent className={cn('p-4', compact && 'p-3')}>
        <div className="flex items-center gap-4">
          {onQuickComplete && (
            <button
              type="button"
              onClick={() => onQuickComplete(habit.id)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-primary bg-primary/10 text-primary transition-all hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={`Mark ${habit.title} complete`}
            >
              <Target className="h-6 w-6" />
            </button>
          )}
          <Link
            to={`/app/habits/${habit.id}`}
            className="flex flex-1 min-w-0 items-center gap-4"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{habit.title}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>+{habit.xp_value} XP</span>
                <span>·</span>
                <span className="capitalize">{frequency}</span>
                {streak > 0 && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-0.5 text-primary">
                      <Flame className="h-3.5 w-3.5" />
                      {streak}
                    </span>
                  </>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </Link>
          {showActions && (onArchive || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <MoreHorizontal className="h-5 w-5" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link to={`/app/habits/${habit.id}/edit`}>
                  <DropdownMenuItem>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                </Link>
                {onArchive && (
                  <DropdownMenuItem onClick={() => onArchive(habit)}>
                    <Archive className="h-4 w-4 mr-2" />
                    {habit.archived ? 'Restore' : 'Archive'}
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={() => onDuplicate(habit)}>
                    Duplicate
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(habit)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {habit.archived && (
            <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Archived
            </span>
          )}
          {syncStatus === 'pending' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary" title="Pending sync">
              <CloudOff className="h-3 w-3" aria-hidden />
              Pending
            </span>
          )}
          {syncStatus === 'conflict' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/20 px-2 py-0.5 text-xs text-secondary" title="Sync conflict">
              <AlertCircle className="h-3 w-3" aria-hidden />
              Conflict
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
