/** Analytics & Reporting: cohorts, retention, funnels, exports, schedules, reports */

export interface Cohort {
  id: string
  name: string
  startedAt: string
  userIds: string[]
  metrics: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

export interface CohortRow {
  cohortId: string
  cohortName: string
  period: string
  size: number
  retained: number
  retentionRate: number
}

export interface CohortSummary {
  cohorts: CohortRow[]
  periodType: 'day' | 'week' | 'month'
}

export interface RetentionPoint {
  period: string
  retained: number
  total: number
  pct: number
}

export interface RetentionCurve {
  cohortId: string
  cohortLabel: string
  points: RetentionPoint[]
}

export interface FunnelStep {
  name: string
  count: number
  conversionRate?: number
  dropoff?: number
}

export interface FunnelData {
  steps: FunnelStep[]
  filters?: Record<string, string>
}

export type ExportFormat = 'csv' | 'json'
export type ExportJobStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'

export interface AnalyticsExportJob {
  id: string
  type: string
  format: ExportFormat
  status: ExportJobStatus
  initiatedBy: string
  createdAt: string
  updatedAt?: string
  completedAt: string | null
  fileUrl: string | null
  scheduleId?: string | null
  filters?: Record<string, unknown>
}

export interface ExportSchedule {
  id: string
  export_type: string
  format: ExportFormat
  cron_expression: string | null
  next_run: string | null
  is_active: boolean
  owner_id: string
  filters: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ReportRow {
  id: string
  title: string
  filters: Record<string, unknown>
  created_at: string
  owner_id: string
  shared_with: string[]
}

/** Report (camelCase from analytics API) */
export interface Report {
  id: string
  title: string
  filters: Record<string, unknown>
  createdAt: string
  ownerId: string
  sharedWith: string[]
}

export interface AnalyticsFilters {
  dateFrom?: string
  dateTo?: string
  cohortId?: string
  channel?: string
  device?: string
  country?: string
  plan?: string
}

export interface UserSearchResult {
  id: string
  email: string
  display_name: string | null
  role: string
  status: string
  created_at: string
}

/** Admin user search (camelCase response from API) */
export interface AdminUserSearchResult {
  id: string
  email: string
  displayName: string | null
  role: string
  status: string
  createdAt: string
}

export interface AnalyticsOverviewMetrics {
  dailyActiveUsers: number
  weeklyActiveUsers: number
  arpu: number
  retentionSnapshot: number
  eventThroughput: number
}
