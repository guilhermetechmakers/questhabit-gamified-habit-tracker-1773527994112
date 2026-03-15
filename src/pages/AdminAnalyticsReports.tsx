import { useState, useMemo } from 'react'
import { AnimatedPage } from '@/components/AnimatedPage'
import {
  AnalyticsCard,
  FilterBar,
  CohortChart,
  RetentionChart,
  FunnelChart,
  ReportTable,
  ExportButton,
  ScheduleManager,
} from '@/components/admin/analytics'
import {
  useAnalyticsCohorts,
  useAnalyticsRetention,
  useAnalyticsFunnels,
  useAnalyticsReports,
  useCreateAnalyticsExport,
} from '@/hooks/use-analytics'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText } from 'lucide-react'
import { toast } from 'sonner'
import type { AnalyticsFilters, Cohort, Report, RetentionCurve } from '@/types/analytics'

export default function AdminAnalyticsReports() {
  const [filters, setFilters] = useState<AnalyticsFilters>({})
  const [activeTab, setActiveTab] = useState('overview')

  const { data: cohortsResult, isLoading: cohortsLoading } = useAnalyticsCohorts(filters)
  const { data: retentionResult, isLoading: retentionLoading } = useAnalyticsRetention({
    cohortId: filters.cohortId,
    range: '28',
  })
  const { data: funnelsResult, isLoading: funnelsLoading } = useAnalyticsFunnels(filters)
  const { data: reportsResult, isLoading: reportsLoading } = useAnalyticsReports()

  const createExport = useCreateAnalyticsExport()

  const cohorts: Cohort[] = useMemo(() => cohortsResult?.cohorts ?? [], [cohortsResult])
  const periodType = cohortsResult?.periodType ?? 'week'
  const curves = useMemo(() => retentionResult?.curves ?? [], [retentionResult])
  const retentionRows = useMemo(() => retentionResult?.data ?? [], [retentionResult])
  const funnelSteps = useMemo(() => funnelsResult?.steps ?? [], [funnelsResult])
  const reports: Report[] = useMemo(() => reportsResult?.data ?? [], [reportsResult])
  const schedules = useMemo(() => [], [])

  const handleExport = async (format: 'csv' | 'json'): Promise<string | void> => {
    try {
      const res = await createExport.mutateAsync({
        type: 'events',
        format,
        filters: { ...filters },
      })
      const jobId = res?.jobId
      if (jobId) {
        toast.success(`Export started. Job ID: ${jobId}`)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed')
    }
  }

  const avgRetention =
    curves.length > 0
      ? Math.round(
          curves.reduce((acc: number, curve: RetentionCurve) => {
            const pts = curve.points ?? []
            const lastIdx = pts.length - 1
            const pct = lastIdx >= 0 ? (pts[lastIdx]?.pct ?? 0) : 0
            return acc + pct
          }, 0) / curves.length
        )
      : 0

  return (
    <AnimatedPage>
      <div className="space-y-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-1">
            Cohort analysis, retention curves, funnels, and exportable reports
          </p>
        </div>

        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          onApply={() => setActiveTab('cohorts')}
          cohortOptions={cohorts.map((c) => ({ id: c.id, name: c.name }))}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AnalyticsCard
            title="Cohorts"
            value={cohorts.length}
            isLoading={cohortsLoading}
          />
          <AnalyticsCard
            title="Avg. retention"
            value={curves.length > 0 ? `${avgRetention}%` : '—'}
            isLoading={retentionLoading}
          />
          <AnalyticsCard
            title="Reports"
            value={reports.length}
            icon={<FileText className="h-4 w-4" />}
            isLoading={reportsLoading}
          />
          <AnalyticsCard
            title="Funnel steps"
            value={funnelSteps.length}
            isLoading={funnelsLoading}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="rounded-xl bg-muted p-1">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background">
              Overview
            </TabsTrigger>
            <TabsTrigger value="cohorts" className="rounded-lg data-[state=active]:bg-background">
              Cohorts
            </TabsTrigger>
            <TabsTrigger value="retention" className="rounded-lg data-[state=active]:bg-background">
              Retention
            </TabsTrigger>
            <TabsTrigger value="funnels" className="rounded-lg data-[state=active]:bg-background">
              Funnels
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg data-[state=active]:bg-background">
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <CohortChart
                cohorts={retentionRows}
                periodType={periodType}
                isLoading={cohortsLoading}
              />
              <RetentionChart
                curves={curves}
                isLoading={retentionLoading}
                onExport={() => handleExport('csv')}
              />
            </div>
            <FunnelChart steps={funnelSteps} isLoading={funnelsLoading} />
          </TabsContent>

          <TabsContent value="cohorts" className="mt-6">
            <CohortChart
              cohorts={retentionRows}
              periodType={periodType}
              isLoading={cohortsLoading}
            />
          </TabsContent>

          <TabsContent value="retention" className="mt-6">
            <RetentionChart
              curves={curves}
              isLoading={retentionLoading}
              onExport={() => handleExport('csv')}
            />
          </TabsContent>

          <TabsContent value="funnels" className="mt-6">
            <FunnelChart steps={funnelSteps} isLoading={funnelsLoading} />
          </TabsContent>

          <TabsContent value="reports" className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Saved reports & exports</h2>
              <ExportButton
                onExport={handleExport}
                disabled={createExport.isPending}
              />
            </div>
            <ReportTable
              reports={reports}
              isLoading={reportsLoading}
              onExport={(id) => toast.info(`Export report ${id} requested`)}
            />
            <ScheduleManager schedules={schedules} isLoading={false} />
          </TabsContent>
        </Tabs>
      </div>
    </AnimatedPage>
  )
}
