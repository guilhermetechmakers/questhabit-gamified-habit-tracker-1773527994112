import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAdminProfile, useAdminDashboardMetrics, useAdminAuditLogs } from '@/hooks/use-admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimatedPage } from '@/components/AnimatedPage'
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  DollarSign,
  UserCog,
  Receipt,
  Shield,
  FileText,
  BarChart3,
} from 'lucide-react'
import {
  MetricTile,
  KPIStreakCard,
  UserSearchPanel,
  ActivityPulse,
  ActionDock,
} from '@/components/admin/dashboard'

export default function AdminDashboard() {
  const { canManageUsers, canModerate, canRefund, canImpersonate } = useAdminProfile()
  const { data: metrics, isLoading, error } = useAdminDashboardMetrics()
  const { data: auditData } = useAdminAuditLogs({ page: 1, pageSize: 8 })

  const m = metrics ?? null
  const totalUsers = m?.totalUsers ?? 0
  const activeUsers = m?.activeUsers ?? 0
  const suspendedUsers = m?.suspendedUsers ?? 0
  const openReports = m?.openReports ?? 0
  const refundsCents = m?.recentRefundsTotalCents ?? 0
  const fraudFlags = m?.fraudFlags ?? 0

  const activityItems = useMemo(() => {
    const logs = Array.isArray(auditData?.logs) ? auditData.logs : []
    return logs.map((l) => ({
      id: l.id,
      action: `${l.action} ${l.target_type}`,
      target: l.target_id ?? undefined,
      time: l.created_at ? new Date(l.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
    }))
  }, [auditData])

  return (
    <AnimatedPage>
      <div className="space-y-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview and quick actions</p>
        </div>

        <ActionDock className="flex-wrap" />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricTile
                title="Total users"
                value={totalUsers}
                icon={Users}
                isLoading={isLoading}
                aria-label="Total users count"
              />
              <MetricTile
                title="Active"
                value={activeUsers}
                icon={UserCheck}
                trend="up"
                isLoading={isLoading}
                aria-label="Active users count"
              />
              <MetricTile
                title="Suspended"
                value={suspendedUsers}
                icon={UserX}
                isLoading={isLoading}
                aria-label="Suspended users count"
              />
              <MetricTile
                title="Open reports"
                value={openReports}
                icon={AlertTriangle}
                isLoading={isLoading}
                aria-label="Open reports count"
              />
            </div>

            <KPIStreakCard
              title="Active users (DAU proxy)"
              value={activeUsers}
              label="Current period"
              isLoading={isLoading}
              aria-label="Active users streak"
            />

            <Card className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Recent refunds total
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-2xl font-bold">—</p>
                ) : (
                  <p className="text-2xl font-bold text-foreground">
                    ${(refundsCents / 100).toFixed(2)}
                  </p>
                )}
                {fraudFlags > 0 && (
                  <p className="text-sm text-amber-600 mt-1">Fraud flags: {fraudFlags}</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-border bg-card shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Quick actions</CardTitle>
                <p className="text-sm text-muted-foreground">Common admin tasks</p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline" className="rounded-xl" asChild>
                  <Link to="/app/admin/analytics-reports">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics & Reports
                  </Link>
                </Button>
                {canManageUsers && (
                  <Button variant="outline" className="rounded-xl" asChild>
                    <Link to="/app/admin/users">
                      <UserCog className="h-4 w-4 mr-2" />
                      Manage users
                    </Link>
                  </Button>
                )}
                {canRefund && (
                  <Button variant="outline" className="rounded-xl" asChild>
                    <Link to="/app/admin/users">
                      <Receipt className="h-4 w-4 mr-2" />
                      Issue refund
                    </Link>
                  </Button>
                )}
                {canModerate && (
                  <Button variant="outline" className="rounded-xl" asChild>
                    <Link to="/app/admin/moderation">
                      <Shield className="h-4 w-4 mr-2" />
                      Moderation queue
                    </Link>
                  </Button>
                )}
                {canImpersonate && (
                  <Button variant="outline" className="rounded-xl" asChild>
                    <Link to="/app/admin/users">
                      <UserCog className="h-4 w-4 mr-2" />
                      Impersonate user
                    </Link>
                  </Button>
                )}
                <Button variant="outline" className="rounded-xl" asChild>
                  <Link to="/app/admin/audit">
                    <FileText className="h-4 w-4 mr-2" />
                    Audit log
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <UserSearchPanel />
            <ActivityPulse items={activityItems} isLoading={false} maxItems={8} />
          </div>
        </div>

        {error && (
          <Card className="rounded-2xl border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error.message}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AnimatedPage>
  )
}
