import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { ScheduleJson } from '@/types/habit'

const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
]

export interface ScheduleEditorProps {
  value: ScheduleJson
  onChange: (schedule: ScheduleJson) => void
  timezone?: string
  onTimezoneChange?: (tz: string) => void
  className?: string
}

export function ScheduleEditor({
  value,
  onChange,
  timezone = 'UTC',
  onTimezoneChange,
  className,
}: ScheduleEditorProps) {
  const frequency = value.frequency ?? 'daily'
  const days = value.days ?? []

  const setFrequency = (f: ScheduleJson['frequency']) => {
    onChange({ ...value, frequency: f })
  }

  const toggleDay = (d: number) => {
    const next = days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort((a, b) => a - b)
    onChange({ ...value, days: next })
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <Label className="text-sm font-medium">Frequency</Label>
        <Tabs
          value={frequency}
          onValueChange={(v) => setFrequency(v as ScheduleJson['frequency'])}
          className="mt-2"
        >
          <TabsList className="grid w-full grid-cols-3 rounded-xl">
            <TabsTrigger value="daily" className="rounded-lg">
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="rounded-lg">
              Weekly
            </TabsTrigger>
            <TabsTrigger value="custom" className="rounded-lg">
              Custom
            </TabsTrigger>
          </TabsList>
          <TabsContent value="daily" className="mt-3">
            <p className="text-sm text-muted-foreground">Complete this habit every day.</p>
          </TabsContent>
          <TabsContent value="weekly" className="mt-3">
            <p className="text-sm text-muted-foreground mb-3">Choose which days of the week.</p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <label
                  key={day.value}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors',
                    days.includes(day.value)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <Checkbox
                    checked={days.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                    className="sr-only"
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="custom" className="mt-3">
            <p className="text-sm text-muted-foreground">Set your own schedule (e.g. specific times).</p>
          </TabsContent>
        </Tabs>
      </div>
      {onTimezoneChange && (
        <div>
          <Label htmlFor="timezone" className="text-sm font-medium">
            Timezone
          </Label>
          <input
            id="timezone"
            type="text"
            value={timezone}
            onChange={(e) => onTimezoneChange(e.target.value)}
            placeholder="UTC"
            className="mt-1 flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      )}
    </div>
  )
}
