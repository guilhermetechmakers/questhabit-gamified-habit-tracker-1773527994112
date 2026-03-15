import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  ChevronLeft,
  ChevronRight,
  Menu,
  Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAdminProfile } from '@/hooks/use-admin'

const navItems = [
  { to: '/app/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/admin/users', label: 'Users', icon: Users },
  { to: '/app/admin/moderation', label: 'Moderation', icon: Shield },
  { to: '/app/admin/audit', label: 'Audit log', icon: FileText },
] as const

interface AdminSidebarProps {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

export function AdminSidebar({ collapsed, onCollapsedChange }: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { canAudit } = useAdminProfile()

  const items = canAudit
    ? navItems
    : navItems.filter((item) => item.to !== '/app/admin/audit')

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-40 md:hidden rounded-xl"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Overlay on mobile when open */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full flex-col border-r border-border bg-card/95 backdrop-blur transition-all duration-300',
          'md:translate-x-0',
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:w-0',
          !collapsed && 'md:!w-56',
          collapsed && 'md:!w-16'
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-3 md:justify-end">
          {!collapsed && (
            <Link to="/app/admin" className="text-lg font-semibold text-primary md:block">
              Admin
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex shrink-0 rounded-xl"
            onClick={() => onCollapsedChange(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-2" aria-label="Admin navigation">
          {(items ?? []).map((item) => {
            const isActive = location.pathname === item.to || (item.to !== '/app/admin' && location.pathname.startsWith(item.to))
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                {(!collapsed || mobileOpen) && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-xl"
            onClick={() => {
              navigate('/app/dashboard')
              setMobileOpen(false)
            }}
          >
            <Home className="h-5 w-5 shrink-0" />
            {(!collapsed || mobileOpen) && <span>Back to app</span>}
          </Button>
        </div>
      </aside>
    </>
  )
}
