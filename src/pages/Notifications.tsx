import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useDeleteNotifications,
} from '@/hooks/use-notifications'
import { AnimatedPage } from '@/components/AnimatedPage'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bell,
  CheckCheck,
  ChevronDown,
  Filter,
  Inbox,
  RefreshCw,
  Trash2,
  Trophy,
  UserPlus,
  Info,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { NotificationListItem, NotificationType } from '@/types/notifications'
import { cn } from '@/lib/utils'

const TYPE_LABELS: Record<NotificationType, string> = {
  reminder: 'Reminder',
  challenge_update: 'Challenge',
  friend_invite: 'Invite',
  system_message: 'System',
}

const TYPE_ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  reminder: Bell,
  challenge_update: Trophy,
  friend_invite: UserPlus,
  system_message: Info,
}

export default function Notifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const userId = user?.id ?? ''
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data: notifications = [], isLoading, refetch } = useNotifications(userId, {
    limit: 100,
    type: typeFilter === 'all' ? undefined : typeFilter,
  })
  const markRead = useMarkNotificationRead(userId)
  const markAllRead = useMarkAllNotificationsRead(userId)
  const deleteOne = useDeleteNotification(userId)
  const deleteMany = useDeleteNotifications(userId)

  const filtered = (notifications as NotificationListItem[]).filter((n) => {
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    return (
      (n.title ?? '').toLowerCase().includes(q) || (n.message ?? '').toLowerCase().includes(q)
    )
  })

  const unreadCount = (notifications as NotificationListItem[]).filter((n) => !n.read).length

  const handleItemClick = useCallback(
    (item: NotificationListItem) => {
      if (!item.read) markRead.mutate(item.id)
      if (item.relatedHabitId) navigate(`/app/habits/${item.relatedHabitId}`)
    },
    [markRead, navigate]
  )

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map((n) => n.id)))
  }

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return
    deleteMany.mutate(Array.from(selectedIds), {
      onSuccess: () => setSelectedIds(new Set()),
    })
  }

  return (
    <AnimatedPage>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            aria-label="Refresh"
          >
            <RefreshCw className={cn('h-5 w-5', isLoading && 'animate-spin')} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => markAllRead.mutate()}
            disabled={unreadCount === 0 || markAllRead.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <Input
          type="search"
          placeholder="Search notifications..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl border-border bg-card flex-1"
          aria-label="Search notifications"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl shrink-0">
              <Filter className="h-4 w-4 mr-1" />
              {typeFilter === 'all' ? 'All' : TYPE_LABELS[typeFilter]}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem onClick={() => setTypeFilter('all')}>All</DropdownMenuItem>
            {(Object.keys(TYPE_LABELS) as NotificationType[]).map((t) => (
              <DropdownMenuItem key={t} onClick={() => setTypeFilter(t)}>
                {TYPE_LABELS[t]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2">
          <Checkbox
            checked={selectedIds.size === filtered.length}
            onCheckedChange={toggleSelectAll}
            aria-label="Select all"
          />
          <span className="text-sm text-muted-foreground flex-1">
            {selectedIds.size} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleBulkDelete}
            disabled={deleteMany.isPending}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl border-border bg-card shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground mb-4">
              <Inbox className="h-7 w-7" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No notifications</p>
            <p className="text-xs text-muted-foreground text-center max-w-[240px]">
              Reminders, challenge updates, and invites will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-320px)]">
          <ul className="space-y-2 pb-4">
            {filtered.map((item) => {
              const Icon = TYPE_ICONS[item.type]
              return (
                <li key={item.id}>
                  <Card
                    className={cn(
                      'rounded-2xl border border-border bg-card shadow-card transition-all duration-200 hover:shadow-card-hover cursor-pointer',
                      !item.read && 'border-primary/30 bg-primary/5'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {selectedIds.size > 0 ? (
                          <Checkbox
                            checked={selectedIds.has(item.id)}
                            onCheckedChange={() => toggleSelect(item.id)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select ${item.title}`}
                          />
                        ) : (
                          <div
                            className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                              item.type === 'reminder' && 'bg-primary/10 text-primary',
                              item.type === 'challenge_update' && 'bg-secondary/10 text-secondary',
                              item.type === 'friend_invite' && 'bg-accent/10 text-accent',
                              item.type === 'system_message' && 'bg-muted text-muted-foreground'
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                        )}
                        <button
                          type="button"
                          className="flex-1 text-left min-w-0"
                          onClick={() => handleItemClick(item)}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'text-sm font-medium truncate',
                                !item.read && 'text-foreground'
                              )}
                            >
                              {item.title}
                            </span>
                            {!item.read && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {item.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                          </p>
                        </button>
                        {selectedIds.size === 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteOne.mutate(item.id)
                            }}
                            disabled={deleteOne.isPending}
                            aria-label="Delete notification"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </li>
              )
            })}
          </ul>
        </ScrollArea>
      )}
    </AnimatedPage>
  )
}
