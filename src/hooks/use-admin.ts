/**
 * Admin hooks: dashboard metrics, users, audit logs, moderation, impersonation.
 * Uses React Query; guards array/response shapes per runtime safety rules.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { authApi } from '@/api/auth'
import { adminApi } from '@/api/admin'

const ADMIN_KEYS = {
  profile: (userId: string | null) => ['admin-profile', userId] as const,
  metrics: ['admin', 'metrics'] as const,
  users: (params: Record<string, unknown>) => ['admin', 'users', params] as const,
  user: (id: string) => ['admin', 'user', id] as const,
  auditLogs: (params?: Record<string, unknown>) => ['admin', 'audit-logs', params ?? {}] as const,
  moderationQueue: ['admin', 'moderation-queue'] as const,
  exportStatus: (jobId: string) => ['admin', 'export-status', jobId] as const,
}

export function useAdminProfile() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const { data: profile, isLoading } = useQuery({
    queryKey: ADMIN_KEYS.profile(userId),
    queryFn: () => (userId ? authApi.getMe(userId) : Promise.resolve(null)),
    enabled: !!userId,
  })
  const role = profile?.role ?? 'user'
  const canAccessAdmin = ['admin', 'moderator', 'support', 'auditor'].includes(role)
  const canManageUsers = role === 'admin'
  const canModerate = role === 'admin' || role === 'moderator'
  const canAudit = role === 'admin' || role === 'auditor'
  const canImpersonate = role === 'admin'
  const canRefund = role === 'admin'
  return {
    profile,
    isLoading,
    role,
    canAccessAdmin,
    canManageUsers,
    canModerate,
    canAudit,
    canImpersonate,
    canRefund,
  }
}

export function useAdminDashboardMetrics() {
  return useQuery({
    queryKey: ADMIN_KEYS.metrics,
    queryFn: () => adminApi.getDashboardMetrics(),
  })
}

export function useAdminUsers(params: { q?: string; status?: string; role?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ADMIN_KEYS.users(params),
    queryFn: async () => {
      const res = await adminApi.getUsers(params)
      const users = Array.isArray(res?.data) ? res.data : []
      const count = typeof res?.count === 'number' ? res.count : 0
      return { users, count, page: res?.page ?? 1, pageSize: res?.pageSize ?? 20 }
    },
  })
}

export function useAdminUser(id: string | null) {
  return useQuery({
    queryKey: ADMIN_KEYS.user(id ?? ''),
    queryFn: () => adminApi.getUser(id!),
    enabled: !!id,
  })
}

export function useAdminAuditLogs(params?: { page?: number; pageSize?: number; targetType?: string }) {
  return useQuery({
    queryKey: ADMIN_KEYS.auditLogs(params),
    queryFn: async () => {
      const res = await adminApi.getAuditLogs(params)
      const logs = Array.isArray(res?.data) ? res.data : []
      const count = typeof res?.count === 'number' ? res.count : 0
      return { logs, count, page: res?.page ?? 1, pageSize: res?.pageSize ?? 50 }
    },
  })
}

export function useAdminModerationQueue(status?: string) {
  return useQuery({
    queryKey: [...ADMIN_KEYS.moderationQueue, status ?? ''],
    queryFn: async () => {
      const res = await adminApi.getModerationQueue(status || undefined)
      return Array.isArray(res?.data) ? res.data : []
    },
  })
}

export function useAdminExportStatus(jobId: string | null) {
  return useQuery({
    queryKey: ADMIN_KEYS.exportStatus(jobId ?? ''),
    queryFn: () => adminApi.getExportStatus(jobId ?? ''),
    enabled: !!jobId,
  })
}

export function useAdminSuspendUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      adminApi.suspendUser(userId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useAdminRestoreUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.restoreUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useAdminSoftDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      adminApi.softDeleteUser(userId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useAdminRestoreSoftDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => adminApi.restoreSoftDelete(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useAdminExportUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.exportUserData(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useAdminRefund() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, amountCents, reason }: { userId: string; amountCents: number; reason?: string }) =>
      adminApi.issueRefund(userId, amountCents, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useAdminModerationAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, action, notes }: { itemId: string; action: string; notes?: string }) =>
      adminApi.moderationAction(itemId, action, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useAdminFeatureContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ contentId, featureUntil }: { contentId: string; featureUntil?: string }) =>
      adminApi.featureContent(contentId, featureUntil),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] })
    },
  })
}

export function useAdminImpersonate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => adminApi.startImpersonation(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-profile'] })
    },
  })
}

export function useAdminStopImpersonation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => adminApi.stopImpersonation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-profile'] })
    },
  })
}
