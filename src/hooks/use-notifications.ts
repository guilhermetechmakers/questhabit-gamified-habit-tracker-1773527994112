import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/api/notifications'
import type { NotificationsListParams } from '@/types/notifications'
import { toast } from 'sonner'

export const notificationKeys = {
  all: (userId: string) => ['notifications', userId] as const,
  list: (userId: string, params?: NotificationsListParams) =>
    ['notifications', userId, 'list', params?.type, params?.unreadOnly, params?.limit, params?.offset] as const,
  detail: (id: string, userId: string) => ['notifications', userId, id] as const,
}

export function useNotifications(userId: string | undefined, params: NotificationsListParams = {}) {
  return useQuery({
    queryKey: notificationKeys.list(userId ?? '', params),
    queryFn: () => notificationsApi.list(userId!, params),
    enabled: !!userId,
  })
}

export function useNotification(id: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: id && userId ? notificationKeys.detail(id, userId) : ['notifications', 'skip'],
    queryFn: () => notificationsApi.getById(id!, userId!),
    enabled: !!id && !!userId,
  })
}

export function useMarkNotificationRead(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id, userId),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: notificationKeys.all(userId) })
      qc.invalidateQueries({ queryKey: notificationKeys.detail(id, userId) })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useMarkAllNotificationsRead(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all(userId) })
      toast.success('All marked as read')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteNotification(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all(userId) })
      toast.success('Notification removed')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteNotifications(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => notificationsApi.deleteMany(ids, userId),
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: notificationKeys.all(userId) })
      if (ids.length > 0) toast.success(ids.length === 1 ? 'Notification removed' : 'Notifications removed')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
