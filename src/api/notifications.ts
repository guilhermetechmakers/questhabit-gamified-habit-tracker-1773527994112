import { supabase } from '@/lib/supabase'
import type {
  NotificationType,
  NotificationPayload,
  NotificationListItem,
  NotificationsListParams,
} from '@/types/notifications'

type NotificationRow = {
  id: string
  user_id: string
  type: string
  payload_json?: Record<string, unknown> | null
  read?: boolean
  created_at: string
}

function toListItem(row: NotificationRow): NotificationListItem {
  const payload = (row.payload_json ?? {}) as NotificationPayload
  return {
    id: row.id,
    type: (row.type as NotificationType) ?? 'system_message',
    title: payload.title ?? 'Notification',
    message: payload.message ?? '',
    timestamp: row.created_at,
    read: Boolean(row.read),
    relatedHabitId: payload.related_habit_id ?? null,
    meta: payload as Record<string, unknown>,
  }
}

export const notificationsApi = {
  list: async (
    userId: string,
    params: NotificationsListParams = {}
  ): Promise<NotificationListItem[]> => {
    const { limit = 50, offset = 0, type, unreadOnly } = params
    let q = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (type) q = q.eq('type', type)
    if (unreadOnly) q = q.eq('read', false)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    const list = Array.isArray(data) ? data : []
    return list.map((row) => toListItem(row as NotificationRow))
  },

  getById: async (id: string, userId: string): Promise<NotificationListItem | null> => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }
    return data ? toListItem(data as NotificationRow) : null
  },

  markRead: async (id: string, userId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
  },

  markAllRead: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    if (error) throw new Error(error.message)
  },

  delete: async (id: string, userId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
  },

  deleteMany: async (ids: string[], userId: string): Promise<void> => {
    if (ids.length === 0) return
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .in('id', ids)
    if (error) throw new Error(error.message)
  },
}
