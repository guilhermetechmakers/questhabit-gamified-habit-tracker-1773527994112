import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BarChart3, Users, FileDown } from 'lucide-react'

export interface ActionDockProps {
  className?: string
}

const ACTIONS = [
  { to: '/app/admin/analytics-reports', label: 'Analytics & Reports', icon: BarChart3 },
  { to: '/app/admin/users', label: 'Manage users', icon: Users },
  { to: '/app/admin/analytics-reports', label: 'Export data', icon: FileDown },
] as const

export function ActionDock({ className }: ActionDockProps) {
  return (
    <div
      className={cn('flex flex-wrap gap-2', className)}
      role="toolbar"
      aria-label="Quick actions"
    >
      {(ACTIONS ?? []).map((a) => {
        const Icon = a.icon
        return (
          <Button
            key={a.to + a.label}
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
            asChild
          >
            <Link to={a.to}>
              <Icon className="h-4 w-4" aria-hidden />
              {a.label}
            </Link>
          </Button>
        )
      })}
    </div>
  )
}
