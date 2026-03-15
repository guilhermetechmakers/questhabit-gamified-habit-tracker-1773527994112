import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  useAdminProfile,
  useAdminUsers,
  useAdminUser,
  useAdminSuspendUser,
  useAdminRestoreUser,
  useAdminSoftDeleteUser,
  useAdminRestoreSoftDeleteUser,
  useAdminExportUser,
  useAdminImpersonate,
} from '@/hooks/use-admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AnimatedPage } from '@/components/AnimatedPage'
import { MoreHorizontal, Search, User, UserX, UserCheck, Trash2, RotateCcw, Download, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { AdminUser as AdminUserType } from '@/types/admin'

const PAGE_SIZE = 20
const STATUS_OPTIONS = ['', 'active', 'suspended', 'deleted', 'pending'] as const
const ROLE_OPTIONS = ['', 'user', 'admin', 'moderator', 'support', 'auditor', 'coach'] as const

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? ''
  const role = searchParams.get('role') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  const [searchInput, setSearchInput] = useState(q)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'suspend' | 'restore' | 'softDelete' | 'restoreSoftDelete'
    userId: string
    label?: string
  } | null>(null)

  const { canManageUsers, canImpersonate } = useAdminProfile()
  const { data, isLoading } = useAdminUsers({
    q: q || undefined,
    status: status || undefined,
    role: role || undefined,
    page,
    pageSize: PAGE_SIZE,
  })
  const users = (data?.users ?? []) as AdminUserType[]
  const count = data?.count ?? 0
  const totalPages = Math.ceil(count / PAGE_SIZE)

  const suspend = useAdminSuspendUser()
  const restore = useAdminRestoreUser()
  const softDelete = useAdminSoftDeleteUser()
  const restoreSoftDelete = useAdminRestoreSoftDeleteUser()
  const exportUser = useAdminExportUser()
  const impersonate = useAdminImpersonate()

  const handleSearch = () => {
    const next = new URLSearchParams(searchParams)
    if (searchInput.trim()) next.set('q', searchInput.trim())
    else next.delete('q')
    next.delete('page')
    setSearchParams(next)
  }

  const setFilter = (key: 'status' | 'role', value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const setPage = (p: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(Math.max(1, Math.min(p, totalPages))))
    setSearchParams(next)
  }

  const runConfirm = async () => {
    if (!confirmAction) return
    const { type, userId } = confirmAction
    try {
      if (type === 'suspend') await suspend.mutateAsync({ userId, reason: 'Suspended from admin' })
      else if (type === 'restore') await restore.mutateAsync(userId)
      else if (type === 'softDelete') await softDelete.mutateAsync({ userId, reason: 'Soft-deleted from admin' })
      else if (type === 'restoreSoftDelete') await restoreSoftDelete.mutateAsync(userId)
      toast.success('Action completed')
      setConfirmAction(null)
      if (profileUserId === userId) setProfileUserId(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed')
    }
  }

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Search, filter, and manage users</p>
        </div>

        <Card className="rounded-2xl border border-border bg-card shadow-card">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
                  <Input
                    type="search"
                    placeholder="Search by name or email..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-9 rounded-xl"
                    aria-label="Search users"
                  />
                </div>
                <Button variant="gradient" className="rounded-xl shrink-0" onClick={handleSearch}>
                  Search
                </Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <select
                  value={status}
                  onChange={(e) => setFilter('status', e.target.value)}
                  className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  aria-label="Filter by status"
                >
                  <option value="">All statuses</option>
                  {STATUS_OPTIONS.filter(Boolean).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select
                  value={role}
                  onChange={(e) => setFilter('role', e.target.value)}
                  className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  aria-label="Filter by role"
                >
                  <option value="">All roles</option>
                  {ROLE_OPTIONS.filter(Boolean).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          {isLoading ? (
            <CardContent className="pt-6">
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            </CardContent>
          ) : users.length === 0 ? (
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>No users match your filters.</p>
            </CardContent>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-medium">User</th>
                      <th className="text-left p-3 font-medium hidden sm:table-cell">Status</th>
                      <th className="text-left p-3 font-medium hidden md:table-cell">Role</th>
                      <th className="text-left p-3 font-medium hidden lg:table-cell">Last active</th>
                      <th className="w-10 p-3" aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-border hover:bg-muted/20 transition-colors"
                      >
                        <td className="p-3">
                          <div>
                            <p className="font-medium text-foreground truncate max-w-[200px]">
                              {u.display_name || u.email}
                            </p>
                            <p className="text-muted-foreground text-xs truncate max-w-[200px]">{u.email}</p>
                          </div>
                        </td>
                        <td className="p-3 hidden sm:table-cell">
                          <span className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            u.status === 'active' && 'bg-green-500/20 text-green-700 dark:text-green-400',
                            u.status === 'suspended' && 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
                            u.status === 'deleted' && 'bg-destructive/20 text-destructive'
                          )}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-3 hidden md:table-cell text-muted-foreground">{u.role}</td>
                        <td className="p-3 hidden lg:table-cell text-muted-foreground text-xs">
                          {u.last_login ? format(new Date(u.last_login), 'PPp') : '—'}
                        </td>
                        <td className="p-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label="Actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem onClick={() => setProfileUserId(u.id)} className="rounded-lg">
                                <User className="h-4 w-4 mr-2" />
                                View profile
                              </DropdownMenuItem>
                              {canManageUsers && u.status === 'active' && (
                                <DropdownMenuItem onClick={() => setConfirmAction({ type: 'suspend', userId: u.id })} className="rounded-lg">
                                  <UserX className="h-4 w-4 mr-2" />
                                  Suspend
                                </DropdownMenuItem>
                              )}
                              {canManageUsers && u.status === 'suspended' && (
                                <DropdownMenuItem onClick={() => setConfirmAction({ type: 'restore', userId: u.id })} className="rounded-lg">
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Restore
                                </DropdownMenuItem>
                              )}
                              {canManageUsers && u.status !== 'deleted' && (
                                <DropdownMenuItem onClick={() => setConfirmAction({ type: 'softDelete', userId: u.id })} className="rounded-lg text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Soft delete
                                </DropdownMenuItem>
                              )}
                              {canManageUsers && u.status === 'deleted' && (
                                <DropdownMenuItem onClick={() => setConfirmAction({ type: 'restoreSoftDelete', userId: u.id })} className="rounded-lg">
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Restore
                                </DropdownMenuItem>
                              )}
                              {canManageUsers && (
                                <DropdownMenuItem
                                  onClick={async () => {
                                    try {
                                      await exportUser.mutateAsync(u.id)
                                      toast.success('Export job started')
                                    } catch (e) {
                                      toast.error(e instanceof Error ? e.message : 'Export failed')
                                    }
                                  }}
                                  className="rounded-lg"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Export data
                                </DropdownMenuItem>
                              )}
                              {canImpersonate && (
                                <DropdownMenuItem
                                  onClick={async () => {
                                    try {
                                      await impersonate.mutateAsync(u.id)
                                      toast.success('Impersonation started')
                                      window.location.href = '/app/dashboard'
                                    } catch (e) {
                                      toast.error(e instanceof Error ? e.message : 'Impersonation failed')
                                    }
                                  }}
                                  className="rounded-lg"
                                >
                                  <LogIn className="h-4 w-4 mr-2" />
                                  Impersonate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    {count} user{count !== 1 ? 's' : ''}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <ProfileDrawer userId={profileUserId} onClose={() => setProfileUserId(null)} onAction={setConfirmAction} />

      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="rounded-2xl" showClose>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === 'suspend' && 'Suspend user'}
              {confirmAction?.type === 'restore' && 'Restore user'}
              {confirmAction?.type === 'softDelete' && 'Soft delete user'}
              {confirmAction?.type === 'restoreSoftDelete' && 'Restore user'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === 'suspend' && 'This will suspend the user. They will not be able to sign in until restored.'}
              {confirmAction?.type === 'restore' && 'This will restore the user so they can sign in again.'}
              {confirmAction?.type === 'softDelete' && 'This will soft-delete the user. You can restore them later.'}
              {confirmAction?.type === 'restoreSoftDelete' && 'This will restore the user account.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button
              variant={confirmAction?.type === 'softDelete' || confirmAction?.type === 'suspend' ? 'destructive' : 'default'}
              onClick={runConfirm}
              disabled={suspend.isPending || restore.isPending || softDelete.isPending || restoreSoftDelete.isPending}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  )
}

function ProfileDrawer({
  userId,
  onClose,
  onAction,
}: {
  userId: string | null
  onClose: () => void
  onAction: (a: { type: 'suspend' | 'restore' | 'softDelete' | 'restoreSoftDelete'; userId: string; label?: string }) => void
}) {
  const { data: user, isLoading } = useAdminUser(userId)
  const { canManageUsers, canImpersonate } = useAdminProfile()
  const exportUser = useAdminExportUser()
  const impersonate = useAdminImpersonate()

  if (!userId) return null

  return (
    <Dialog open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl max-w-md" showClose>
        <DialogHeader>
          <DialogTitle>User profile</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : user ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Display name</p>
              <p className="font-medium">{user.display_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{user.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium">{user.role}</p>
            </div>
            {user.last_login && (
              <div>
                <p className="text-sm text-muted-foreground">Last login</p>
                <p className="font-medium">{format(new Date(user.last_login), 'PPp')}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              {canManageUsers && user.status === 'active' && (
                <Button variant="outline" size="sm" onClick={() => onAction({ type: 'suspend', userId: user.id })}>
                  Suspend
                </Button>
              )}
              {canManageUsers && user.status === 'suspended' && (
                <Button variant="outline" size="sm" onClick={() => onAction({ type: 'restore', userId: user.id })}>
                  Restore
                </Button>
              )}
              {canManageUsers && user.status !== 'deleted' && (
                <Button variant="outline" size="sm" className="text-destructive" onClick={() => onAction({ type: 'softDelete', userId: user.id })}>
                  Soft delete
                </Button>
              )}
              {canManageUsers && user.status === 'deleted' && (
                <Button variant="outline" size="sm" onClick={() => onAction({ type: 'restoreSoftDelete', userId: user.id })}>
                  Restore
                </Button>
              )}
              {canManageUsers && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await exportUser.mutateAsync(user.id)
                      toast.success('Export job started')
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Export failed')
                    }
                  }}
                >
                  Export data
                </Button>
              )}
              {canImpersonate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await impersonate.mutateAsync(user.id)
                      toast.success('Impersonation started')
                      onClose()
                      window.location.href = '/app/dashboard'
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Impersonation failed')
                    }
                  }}
                >
                  Impersonate
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">User not found.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
