import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ListTodo, PlusCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/habits', label: 'Habits', icon: ListTodo },
  { to: '/app/habits/new', label: 'New', icon: PlusCircle, fab: true },
  { to: '/app/profile', label: 'Profile', icon: User },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur md:max-w-lg md:left-1/2 md:-translate-x-1/2">
      <div className="flex h-16 items-center justify-around px-2">
        {items.map((item) => {
          const isActive =
        location.pathname === item.to ||
        (item.to !== '/app/habits/new' && location.pathname.startsWith(item.to + '/'))
          const Icon = item.icon
          if (item.fab) {
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex h-14 w-14 -translate-y-4 items-center justify-center rounded-2xl bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--primary-end))] text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95"
                aria-label={item.label}
              >
                <PlusCircle className="h-7 w-7" />
              </Link>
            )
          }
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-muted-foreground transition-colors hover:text-foreground',
                isActive && 'text-primary font-medium'
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
