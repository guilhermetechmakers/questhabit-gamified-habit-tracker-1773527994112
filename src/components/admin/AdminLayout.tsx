import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Shield, FileText, BarChart3, ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ImpersonationBanner } from './ImpersonationBanner'
import { useAuth } from '@/contexts/auth-context'
import { useProfile } from '@/hooks/use-profile'
import { useAdminStopImpersonation } from '@/hooks/use-admin'

const NAV_ITEMS = [
  { to: '/app/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/admin/analytics-reports', end: false, label: 'Analytics & Reports', icon: BarChart3 },
  { to: '/app/admin/users', end: false, label: 'Users', icon: Users },
  { to: '/app/admin/moderation', end: false, label: 'Moderation', icon: Shield },
  { to: '/app/admin/audit', end: false, label: 'Audit', icon: FileText },
] as const

export function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id)
  const stopImpersonation = useAdminStopImpersonation()

  const impersonatingUserId = profile?.impersonating_user_id ?? null
  const showBanner = !!impersonatingUserId

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-border bg-card/95 backdrop-blur transition-[width] duration-300 ease-in-out',
          sidebarCollapsed ? 'w-[4rem]' : 'w-56'
        )}
        aria-label="Admin navigation"
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-3">
          {!sidebarCollapsed && (
            <span className="text-sm font-semibold text-foreground">Admin</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="shrink-0"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {(NAV_ITEMS ?? []).map((item) => {
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to)
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center border-b border-border bg-card/95 backdrop-blur px-4 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Open admin menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <span className="text-sm font-semibold text-foreground">Admin</span>
      </div>

      {/* Mobile overlay menu */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex h-full w-56 flex-col border-r border-border bg-card shadow-lg transition-transform duration-300 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Admin navigation (mobile)"
      >
        <div className="flex h-14 items-center justify-end border-b border-border px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {(NAV_ITEMS ?? []).map((item) => {
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to)
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
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col pt-14 md:pt-0">
        <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
          {showBanner && (
            <div className="mb-4">
              <ImpersonationBanner
                impersonatedUserName={null}
                onStop={() => stopImpersonation.mutate()}
                isStopping={stopImpersonation.isPending}
              />
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
