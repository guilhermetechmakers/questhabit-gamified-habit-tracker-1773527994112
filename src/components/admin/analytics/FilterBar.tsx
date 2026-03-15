import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { AnalyticsFilters } from '@/types/analytics'

export interface FilterBarProps {
  filters: AnalyticsFilters
  onFiltersChange: (f: AnalyticsFilters) => void
  onApply?: () => void
  cohortOptions?: { id: string; name: string }[]
  className?: string
}

const CHANNELS = [
  { value: '', label: 'All channels' },
  { value: 'web', label: 'Web' },
  { value: 'mobile', label: 'Mobile' },
]
const DEVICES = [
  { value: '', label: 'All devices' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile', label: 'Mobile' },
]

export function FilterBar({
  filters,
  onFiltersChange,
  onApply,
  cohortOptions = [],
  className,
}: FilterBarProps) {
  const set = (key: keyof AnalyticsFilters, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <Card className={cn('rounded-2xl border border-border bg-card', className)}>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="date-from" className="text-xs text-muted-foreground">
              From
            </Label>
            <Input
              id="date-from"
              type="date"
              value={filters.dateFrom ?? ''}
              onChange={(e) => set('dateFrom', e.target.value || undefined)}
              className="rounded-xl"
              aria-label="Date from"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date-to" className="text-xs text-muted-foreground">
              To
            </Label>
            <Input
              id="date-to"
              type="date"
              value={filters.dateTo ?? ''}
              onChange={(e) => set('dateTo', e.target.value || undefined)}
              className="rounded-xl"
              aria-label="Date to"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="channel" className="text-xs text-muted-foreground">
              Channel
            </Label>
            <select
              id="channel"
              value={filters.channel ?? ''}
              onChange={(e) => set('channel', e.target.value || undefined)}
              className="h-10 w-[140px] rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Channel filter"
            >
              {CHANNELS.map((o) => (
                <option key={o.value || 'all'} value={o.value || 'all'}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {cohortOptions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="cohort" className="text-xs text-muted-foreground">
                Cohort
              </Label>
              <select
                id="cohort"
                value={filters.cohortId ?? ''}
                onChange={(e) => set('cohortId', e.target.value || undefined)}
                className="h-10 w-[140px] rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Cohort filter"
              >
                <option value="">All</option>
                {cohortOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="device" className="text-xs text-muted-foreground">
              Device
            </Label>
            <select
              id="device"
              value={filters.device ?? ''}
              onChange={(e) => set('device', e.target.value || undefined)}
              className="h-10 w-[140px] rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Device filter"
            >
              {DEVICES.map((o) => (
                <option key={o.value || 'all'} value={o.value || 'all'}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {onApply && (
            <Button
              variant="gradient"
              className="rounded-xl shrink-0"
              onClick={onApply}
            >
              Apply
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
