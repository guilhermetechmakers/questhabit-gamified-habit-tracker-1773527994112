import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Report } from '@/types/analytics'
import { FileText } from 'lucide-react'

export interface ReportTableProps {
  reports: Report[]
  isLoading?: boolean
  onExport?: (reportId: string) => void
  className?: string
}

const STATUS_STYLES: Record<string, string> = {
  saved: 'bg-muted text-muted-foreground',
  shared: 'bg-primary/15 text-primary',
}

export function ReportTable({
  reports,
  isLoading,
  onExport,
  className,
}: ReportTableProps) {
  const list = reports ?? []

  if (isLoading) {
    return (
      <Card className={cn('rounded-2xl border border-border bg-card', className)}>
        <CardHeader>
          <CardTitle className="text-lg">Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'rounded-2xl border border-border bg-card shadow-card transition-all duration-300',
        className
      )}
    >
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" aria-hidden />
          Saved reports
        </CardTitle>
        <p className="text-sm text-muted-foreground">Ad-hoc reports with filters</p>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mb-2 opacity-50" aria-hidden />
            <p>No reports yet</p>
            <p className="text-sm mt-1">Create a report from the Cohorts or Retention view</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table" aria-label="Reports list">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium">Title</th>
                  <th className="text-left py-3 px-2 font-medium">Created</th>
                  <th className="text-left py-3 px-2 font-medium">Status</th>
                  <th className="text-right py-3 px-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-2 font-medium">{r.title}</td>
                    <td className="py-3 px-2 text-muted-foreground">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          (Array.isArray(r.sharedWith) ? r.sharedWith.length : 0) > 0 ? STATUS_STYLES.shared : STATUS_STYLES.saved
                        )}
                      >
                        {(Array.isArray(r.sharedWith) ? r.sharedWith.length : 0) > 0 ? 'Shared' : 'Saved'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {onExport && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => onExport(r.id)}
                          aria-label={`Export report ${r.title}`}
                        >
                          Export
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
