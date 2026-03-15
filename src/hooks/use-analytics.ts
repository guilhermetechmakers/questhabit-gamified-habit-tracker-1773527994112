/**
 * Analytics & Reporting hooks. Uses React Query; guards array/response shapes per runtime safety.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import type { AnalyticsFilters, Cohort, CohortRow, Report } from '@/types/analytics'

const ANALYTICS_KEYS = {
  cohorts: (filters?: AnalyticsFilters) => ['analytics', 'cohorts', filters ?? {}] as const,
  retention: (params: { cohortId?: string; range?: string }) =>
    ['analytics', 'retention', params] as const,
  funnels: (filters?: AnalyticsFilters) => ['analytics', 'funnels', filters ?? {}] as const,
  exportStatus: (jobId: string) => ['analytics', 'export', jobId] as const,
  reports: (filters?: Record<string, string>) => ['analytics', 'reports', filters ?? {}] as const,
  userSearch: (q: string) => ['analytics', 'user-search', q] as const,
}

export function useAnalyticsCohorts(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.cohorts(filters),
    queryFn: async (): Promise<{ data: Cohort[]; cohorts: Cohort[]; periodType: 'week' }> => {
      const res = await adminApi.getCohorts(filters)
      const data: Cohort[] = Array.isArray(res?.data) ? (res.data as unknown as Cohort[]) : []
      return { data, cohorts: data, periodType: 'week' }
    },
  })
}

export function useAnalyticsRetention(params?: { cohortId?: string; range?: string }) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.retention(params ?? {}),
    queryFn: async () => {
      const res = await adminApi.getRetention(params)
      const data: CohortRow[] = Array.isArray(res?.data) ? (res.data as unknown as CohortRow[]) : []
      const curves = data.map((r) => ({
        cohortId: r.cohortId,
        cohortLabel: r.cohortName,
        points: [{ period: r.period, retained: r.retained, total: r.size, pct: r.retentionRate * 100 }],
      }))
      return { data, curves }
    },
  })
}

export function useAnalyticsFunnels(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.funnels(filters),
    queryFn: async () => {
      const res = await adminApi.getFunnels(filters)
      const data = Array.isArray(res?.data) ? res.data : []
      return { data, steps: data }
    },
  })
}

export function useCreateAnalyticsExport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      type?: 'cohort' | 'retention' | 'events' | 'report'
      format: 'csv' | 'json'
      filters?: Record<string, unknown>
      scheduleId?: string
    }) =>
      adminApi.createExport({
        type: payload.format,
        filters: (payload.filters ?? undefined) as unknown as AnalyticsFilters | undefined,
        scheduleId: payload.scheduleId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useAnalyticsExportStatus(jobId: string | null) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.exportStatus(jobId ?? ''),
    queryFn: () => adminApi.getExportJob(jobId!),
    enabled: !!jobId,
  })
}

export function useUpdateAnalyticsExport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ jobId, action }: { jobId: string; action: 'pause' | 'resume' | 'cancel' }) =>
      adminApi.updateExportJob(jobId, action),
    onSuccess: (_, { jobId }) => {
      qc.invalidateQueries({ queryKey: ANALYTICS_KEYS.exportStatus(jobId) })
      qc.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useAnalyticsReports(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.reports(filters),
    queryFn: async (): Promise<{ data: Report[] }> => {
      const res = await adminApi.getReports(filters as unknown as AnalyticsFilters | undefined)
      const data: Report[] = Array.isArray(res?.data) ? (res.data as unknown as Report[]) : []
      return { data }
    },
  })
}

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.userSearch(query),
    queryFn: async () => {
      const res = await adminApi.searchUsers(query)
      const data = Array.isArray(res?.data) ? res.data : []
      return { data }
    },
    enabled: query.trim().length >= 2,
  })
}
