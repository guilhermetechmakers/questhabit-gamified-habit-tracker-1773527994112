import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Plus, Trash2 } from 'lucide-react'
import type { Reminder } from '@/types/habit'

export interface ReminderEditorProps {
  reminders: Reminder[]
  onAdd: (timeOfDay: string) => void
  onRemove: (id: string) => void
  onToggle?: (id: string, enabled: boolean) => void
  maxReminders?: number
  className?: string
}

function formatTimeForInput(time: string): string {
  if (/^\d{2}:\d{2}$/.test(time)) return time
  if (time.includes(':')) {
    const [h, m] = time.split(':')
    return `${h.padStart(2, '0')}:${(m ?? '00').padStart(2, '0')}`
  }
  return '09:00'
}

export function ReminderEditor({
  reminders,
  onAdd,
  onRemove,
  onToggle,
  maxReminders = 5,
  className,
}: ReminderEditorProps) {
  const [newTime, setNewTime] = useState('09:00')
  const canAdd = (reminders ?? []).length < maxReminders

  const handleAdd = () => {
    const trimmed = newTime.trim()
    if (!trimmed) return
    const match = trimmed.match(/^(\d{1,2}):(\d{2})$/)
    const normalized = match
      ? `${match[1].padStart(2, '0')}:${match[2]}`
      : trimmed.length <= 5 ? `${trimmed.padStart(2, '0')}:00` : '09:00'
    onAdd(normalized)
    setNewTime('09:00')
  }

  const list = Array.isArray(reminders) ? reminders : []

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Reminders</Label>
        {list.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {list.length} / {maxReminders}
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {list.map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"
          >
            <input
              type="time"
              value={formatTimeForInput(r.time_of_day)}
              readOnly
              className="flex h-9 w-24 rounded-lg border-0 bg-muted/50 px-2 text-sm"
            />
            {onToggle && (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={r.enabled}
                  onChange={(e) => onToggle(r.id, e.target.checked)}
                  className="rounded border-input"
                />
                On
              </label>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(r.id)}
              aria-label="Remove reminder"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
      {canAdd && (
        <div className="flex gap-2">
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="flex h-10 w-28 rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      )}
    </div>
  )
}
