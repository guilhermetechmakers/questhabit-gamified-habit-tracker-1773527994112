import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminProfile, useAdminDashboardMetrics } from '@/hooks/use-admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedPage } from '@/components/AnimatedPage'
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  DollarSign,
  Search,
  UserCog,
  Receipt,
  Shield,
  FileText,
} from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { canManageUsers, canModerate, canRefund, canImpersonate } = useAdminProfile()
  const { data: metrics, isLoading, error } = useAdminDashboardMetrics()
  const [searchQ, setSearchQ] = useState('')

  const handleSearch = () => {
    if (searchQ.trim()) {
      navigate(`/app/admin/users?q=${encodeURIComponent(searchQ.trim())}`)
    } else {
      navigate('/app/admin/users')
    }
  }

  const m = metrics ?? null
  const totalUsers = m?.totalUsers ?? 0
  const activeUsers = m?.activeUsers ?? 0
  const suspendedUsers = m?.suspendedUsers ?? 0
  const openReports = m?.openReports ?? 0
  const refundsCents = m?.recentRefundsTotalCents ?? 0
  const fraudFlags = m?.fraudFlags ?? 0

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview and quick actions</p>
        </div>

        {/* Search */}
        <Card className="rounded-2xl border border-border bg-card shadow-card">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
                <Input
                  type="search"
                  placeholder="Search by name or email..."
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9 rounded-xl"
                  aria-label="Search users"
                />
              </div>
              <Button variant="gradient" className="rounded-xl shrink-0" onClick={handleSearch}>
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{activeUsers}</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserX className="h-4 w-4 text-amber-600" />
                Suspended
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{suspendedUsers}</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-secondary" />
                Open reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{openReports}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {error && (
          <Card className="rounded-2xl border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {/* Revenue / refunds */}
        <Card className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Recent refunds total
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
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

        {/* Quick actions */}
        <Card className="rounded-2xl border border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Quick actions</CardTitle>
            <p className="text-sm text-muted-foreground">Common admin tasks</p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {canManageUsers && (
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => navigate('/app/admin/users')}
                asChild
              >
                <Link to="/app/admin/users">
                  <UserCog className="h-4 w-4 mr-2" />
                  Manage users
                </Link>
              </Button>
            )}
            {canRefund && (
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => navigate('/app/admin/users')}
                asChild
              >
                <Link to="/app/admin/users">
                  <Receipt className="h-4 w-4 mr-2" />
                  Issue refund
                </Link>
              </Button>
            )}
            {canModerate && (
              <Button
                variant="outline"
                className="rounded-xl"
                asChild
              >
                <Link to="/app/admin/moderation">
                  <Shield className="h-4 w-4 mr-2" />
                  Moderation queue
                </Link>
              </Button>
            )}
            {canImpersonate && (
              <Button
                variant="outline"
                className="rounded-xl"
                asChild
              >
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
    </AnimatedPage>
  )
}
