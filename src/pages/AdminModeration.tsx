import { useState } from 'react'
import {
  useAdminModerationQueue,
  useAdminModerationAction,
  useAdminProfile,
} from '@/hooks/use-admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedPage } from '@/components/AnimatedPage'
import { Shield, AlertCircle, CheckCircle, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { ModerationReportItem } from '@/types/admin'

const STATUS_TABS = ['open', 'in_review', 'resolved'] as const
const ACTIONS = ['resolve', 'remove_content', 'warn', 'suspend_user'] as const

export default function AdminModeration() {
  const [statusFilter, setStatusFilter] = useState<string>('open')
  const { canModerate } = useAdminProfile()
  const { data: items = [], isLoading } = useAdminModerationQueue(statusFilter || undefined)
  const moderationAction = useAdminModerationAction()

  const reports = Array.isArray(items) ? items : []

  const handleAction = async (itemId: string, action: string, notes?: string) => {
    try {
      await moderationAction.mutateAsync({ itemId, action, notes })
      toast.success('Action applied')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed')
    }
  }

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content Moderation</h1>
          <p className="text-muted-foreground mt-1">Review reports and take action</p>
        </div>

        <Card className="rounded-2xl border border-border bg-card shadow-card">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((tab) => (
                <Button
                  key={tab}
                  variant={statusFilter === tab ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-xl capitalize"
                  onClick={() => setStatusFilter(tab)}
                >
                  {tab.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No reports in this queue.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {reports.map((item: ModerationReportItem) => (
                  <li key={item.id}>
                    <Card className="rounded-xl border border-border overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">
                                Content ID: {item.content_id}
                              </p>
                              {item.content_snippet && (
                                <p className="mt-1 text-foreground line-clamp-2 bg-muted/50 rounded-lg p-2 text-sm">
                                  {item.content_snippet}
                                </p>
                              )}
                              {item.reason && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  Reason: {item.reason}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                Reported {format(new Date(item.created_at), 'PPp')}
                              </p>
                            </div>
                            <span
                              className={cn(
                                'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                                item.status === 'open' && 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
                                item.status === 'in_review' && 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
                                item.status === 'resolved' && 'bg-green-500/20 text-green-700 dark:text-green-400'
                              )}
                            >
                              {item.status}
                            </span>
                          </div>
                          {canModerate && item.status !== 'resolved' && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                              {ACTIONS.map((action) => (
                                <Button
                                  key={action}
                                  variant="outline"
                                  size="sm"
                                  className="rounded-lg capitalize"
                                  disabled={moderationAction.isPending}
                                  onClick={() => handleAction(item.id, action)}
                                >
                                  {action === 'resolve' && <CheckCircle className="h-4 w-4 mr-1" />}
                                  {action === 'remove_content' && <AlertCircle className="h-4 w-4 mr-1" />}
                                  {action === 'warn' && <MessageSquare className="h-4 w-4 mr-1" />}
                                  {action.replace('_', ' ')}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AnimatedPage>
  )
}
