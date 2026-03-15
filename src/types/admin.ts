/** Admin Controls: RBAC, audit, moderation, exports */

export type AdminRole = 'admin' | 'moderator' | 'support' | 'auditor'
export type UserStatus = 'active' | 'suspended' | 'deleted' | 'pending'
export type RefundStatus = 'pending' | 'completed' | 'failed'
export type ReportStatus = 'open' | 'in_review' | 'resolved'
export type ExportJobStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export interface AdminUser {
  id: string
  email: string
  display_name: string | null
  role: string
  status: UserStatus
  created_at: string
  last_login: string | null
  updated_at?: string
}

export interface DashboardMetrics {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  openReports: number
  recentRefundsTotalCents: number
  fraudFlags: number
}

export interface AuditLogEntry {
  id: string
  admin_user_id: string
  action: string
  target_type: string
  target_id: string | null
  detail: string | null
  created_at: string
}

export interface ModerationReportItem {
  id: string
  content_id: string
  content_snippet: string | null
  reported_by: string | null
  reason: string | null
  status: ReportStatus
  created_at: string
  resolved_at: string | null
}

export interface ExportJob {
  id: string
  type: string
  status: ExportJobStatus
  initiated_by: string
  created_at: string
  completed_at: string | null
  file_url: string | null
  format?: 'csv' | 'json'
  schedule_id?: string | null
  filters?: Record<string, unknown>
}
