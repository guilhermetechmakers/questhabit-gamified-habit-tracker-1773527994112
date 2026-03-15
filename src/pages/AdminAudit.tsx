import { useState } from 'react'
import { useAdminAuditLogs, useAdminProfile } from '@/hooks/use-admin'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AnimatedPage } from '@/components/AnimatedPage'
import { FileText } from 'lucide-react'
import { format } from 'date-fns'

const PAGE_SIZE = 50

export default function AdminAudit() {
  const [page, setPage] = useState(1)
  const { canAudit } = useAdminProfile()
  const { data, isLoading } = useAdminAuditLogs({ page, pageSize: PAGE_SIZE })

  const logs = (data?.logs ?? []) as Array<{
    id: string
    admin_user_id: string
    action: string
    target_type: string
    target_id: string | null
    detail: string | null
    created_at: string
  }>
  const count = data?.count ?? 0
  const totalPages = Math.ceil(count / PAGE_SIZE)

  if (!canAudit) {
    return (
      <AnimatedPage>
        <Card className="rounded-2xl border border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>You do not have permission to view audit logs.</p>
          </CardContent>
        </Card>
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit log</h1>
          <p className="text-muted-foreground mt-1">History of admin actions</p>
        </div>

        <Card className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          {isLoading ? (
            <CardContent className="pt-6">
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            </CardContent>
          ) : logs.length === 0 ? (
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No audit entries yet.</p>
            </CardContent>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-medium">Time</th>
                      <th className="text-left p-3 font-medium">Action</th>
                      <th className="text-left p-3 font-medium">Target</th>
                      <th className="text-left p-3 font-medium hidden sm:table-cell">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((entry) => (
                      <tr key={entry.id} className="border-b border-border hover:bg-muted/20">
                        <td className="p-3 text-muted-foreground whitespace-nowrap">
                          {format(new Date(entry.created_at), 'PPp')}
                        </td>
                        <td className="p-3 font-medium">{entry.action}</td>
                        <td className="p-3">
                          {entry.target_type}
                          {entry.target_id && (
                            <span className="text-muted-foreground ml-1">({entry.target_id})</span>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground hidden sm:table-cell max-w-[200px] truncate">
                          {entry.detail ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border px-4 py-3">
                  <p className="text-sm text-muted-foreground">{count} entries</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </AnimatedPage>
  )
}
