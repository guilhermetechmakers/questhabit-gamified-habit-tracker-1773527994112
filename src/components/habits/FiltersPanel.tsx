/**
 * Expandable filters panel: search, status (active/archived/template), tags, date range.
 */

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible'
import { Search, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

export type HabitStatusFilter = 'active' | 'archived' | 'template' | 'all'

export interface FiltersPanelProps {
  search: string
  onSearchChange: (value: string) => void
  status: HabitStatusFilter
  onStatusChange: (value: HabitStatusFilter) => void
  tags?: string[]
  selectedTags?: string[]
  onTagToggle?: (tag: string) => void
  dateRange?: { from: string; to: string }
  onDateRangeChange?: (range: { from: string; to: string }) => void
  className?: string
}

const STATUS_OPTIONS: { value: HabitStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'template', label: 'Templates' },
]

export function FiltersPanel({
  search,
  onSearchChange,
  status,
  onStatusChange,
  tags = [],
  selectedTags = [],
  onTagToggle,
  className,
}: FiltersPanelProps) {
  const [open, setOpen] = React.useState(false)
  const searchId = React.useId()
  const statusId = React.useId()

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn('rounded-xl border border-border bg-card p-4', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden />
          <Input
            id={searchId}
            type="search"
            placeholder="Search habits"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 rounded-lg"
            aria-label="Search habits"
          />
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-lg gap-1.5" aria-expanded={open}>
            <Filter className="h-4 w-4" />
            Filters
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          <div>
            <label htmlFor={statusId} className="block text-sm font-medium text-foreground mb-1.5">
              Status
            </label>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby={statusId}>
              {STATUS_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={status === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-lg"
                  onClick={() => onStatusChange(opt.value)}
                  aria-pressed={status === opt.value}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {Array.isArray(tags) && tags.length > 0 && onTagToggle && (
            <div>
              <span className="block text-sm font-medium text-foreground mb-1.5">Tags</span>
              <div className="flex flex-wrap gap-2">
                {(tags ?? []).map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant={selectedTags.includes(tag) ? 'secondary' : 'outline'}
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => onTagToggle(tag)}
                    aria-pressed={selectedTags.includes(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
