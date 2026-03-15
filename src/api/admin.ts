/**
 * Admin API: calls the admin Edge Function with path + method + body/query.
 * RBAC enforced server-side. Use only when user has admin role (checked by hook/layout).
 */
import { supabase } from '@/lib/supabase'
import type {
  DashboardMetrics,
  AdminUser,
  AuditLogEntry,
  ModerationReportItem,
  ExportJob,
} from '@/types/admin'

export interface AdminRequestOptions {
  path: string
  method?: string
  body?: Record<string, unknown>
  query?: Record<string, string>
}

async function adminRequest<T>(options: AdminRequestOptions): Promise<T> {
  const { path, method = 'GET', body = {}, query = {} } = options
  const { data, error } = await supabase.functions.invoke('admin', {
    body: { path, method, body, query },
  })
  if (error) throw new Error(error.message ?? 'Admin API error')
  const err = (data as { error?: string })?.error
  if (err) throw new Error(err)
  return data as T
}

export const adminApi = {
  getDashboardMetrics: (): Promise<DashboardMetrics> =>
    adminRequest({ path: 'dashboard-metrics', method: 'GET' }),

  getUsers: (params: { q?: string; status?: string; role?: string; page?: number; pageSize?: number }) => {
    const query: Record<string, string> = {}
    if (params.q != null) query.q = String(params.q)
    if (params.status != null) query.status = String(params.status)
    if (params.role != null) query.role = String(params.role)
    if (params.page != null) query.page = String(params.page)
    if (params.pageSize != null) query.pageSize = String(params.pageSize)
    return adminRequest<{ data: AdminUser[]; count: number; page: number; pageSize: number }>({
      path: 'users',
      method: 'GET',
      query,
    })
  },

  getUser: (userId: string): Promise<AdminUser> =>
    adminRequest({ path: `users/${userId}`, method: 'GET' }),

  suspendUser: (userId: string, reason?: string, until?: string): Promise<{ success: boolean }> =>
    adminRequest({
      path: `users/${userId}/suspend`,
      method: 'POST',
      body: { userId, reason, until },
    }),

  restoreUser: (userId: string): Promise<{ success: boolean }> =>
    adminRequest({
      path: `users/${userId}/restore`,
      method: 'POST',
      body: { userId },
    }),

  softDeleteUser: (userId: string, reason?: string): Promise<{ success: boolean }> =>
    adminRequest({
      path: `users/${userId}/soft-delete`,
      method: 'POST',
      body: { userId, reason },
    }),

  restoreSoftDelete: (userId: string): Promise<{ success: boolean }> =>
    adminRequest({
      path: `users/${userId}/restore-soft-delete`,
      method: 'POST',
      body: { userId },
    }),

  exportUserData: (userId: string): Promise<{ jobId: string }> =>
    adminRequest({
      path: `users/${userId}/export`,
      method: 'POST',
      body: { userId },
    }),

  issueRefund: (userId: string, amountCents: number, reason?: string): Promise<{ success: boolean; refundId?: string }> =>
    adminRequest({
      path: 'refund',
      method: 'POST',
      body: { userId, amount: amountCents, reason },
    }),

  getAuditLogs: (params?: { page?: number; pageSize?: number }) => {
    const query: Record<string, string> = {}
    if (params?.page != null) query.page = String(params.page)
    if (params?.pageSize != null) query.pageSize = String(params.pageSize)
    return adminRequest<{ data: AuditLogEntry[]; count: number; page: number; pageSize: number }>({
      path: 'audit-logs',
      method: 'GET',
      query,
    })
  },

  getModerationQueue: (status?: string): Promise<{ data: ModerationReportItem[] }> =>
    adminRequest({
      path: 'moderation/queue',
      method: 'GET',
      query: status ? { status } : {},
    }),

  moderationAction: (itemId: string, action: string, notes?: string): Promise<{ success: boolean }> =>
    adminRequest({
      path: 'moderation/actions',
      method: 'POST',
      body: { itemId, action, notes },
    }),

  featureContent: (contentId: string, featureUntil?: string): Promise<{ success: boolean }> =>
    adminRequest({
      path: 'content/feature',
      method: 'POST',
      body: { contentId, featureUntil },
    }),

  startImpersonation: (userId: string): Promise<{ success: boolean; sessionId?: string }> =>
    adminRequest({
      path: 'impersonate',
      method: 'POST',
      body: { userId },
    }),

  stopImpersonation: (): Promise<{ success: boolean }> =>
    adminRequest({
      path: 'impersonation/stop',
      method: 'POST',
    }),

  getExportStatus: (jobId: string): Promise<ExportJob> =>
    adminRequest({
      path: `exports/${jobId}/status`,
      method: 'GET',
    }),
}
