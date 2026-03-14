/** In-app notification (Notifications Center) */
export type NotificationType =
  | 'reminder'
  | 'challenge_update'
  | 'friend_invite'
  | 'system_message'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  read: boolean
  related_habit_id?: string | null
  meta?: Record<string, unknown>
  created_at?: string
  payload_json?: Record<string, unknown>
}

/** List item shape for Notifications Center UI */
export interface NotificationListItem {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  read: boolean
  relatedHabitId: string | null
  meta?: Record<string, unknown>
}

export interface NotificationsListParams {
  limit?: number
  offset?: number
  type?: NotificationType
  unreadOnly?: boolean
}

export interface NotificationPayload {
  title?: string
  message?: string
  related_habit_id?: string | null
  [key: string]: unknown
}

/** Delivery log entry (server-side tracking) */
export type NotificationLogStatus = 'delivered' | 'failed' | 'pending'

export interface NotificationLogEntry {
  id: string
  user_id: string
  type: string
  title: string | null
  message: string | null
  sent_at: string
  status: NotificationLogStatus
  error: string | null
  related_habit_id: string | null
  created_at: string
}

/** User notification preferences */
export interface QuietHours {
  start: string
  end: string
}

export interface PreferredChannels {
  push: boolean
  email: boolean
}

export type ThemePreference = 'light' | 'dark' | 'system'
export type SyncFrequency = 'auto' | 'manual' | 'interval'

export interface UserNotificationSettings {
  user_id: string
  push_enabled: boolean
  email_enabled: boolean
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  timezone: string
  theme: ThemePreference
  onboarding_completed: boolean
  sync_frequency: SyncFrequency
  preferred_channels: PreferredChannels
  created_at?: string
  updated_at?: string
}

export interface UpdateNotificationSettingsInput {
  push_enabled?: boolean
  email_enabled?: boolean
  quiet_hours_start?: string | null
  quiet_hours_end?: string | null
  timezone?: string
  theme?: ThemePreference
  onboarding_completed?: boolean
  sync_frequency?: SyncFrequency
  preferred_channels?: PreferredChannels
}

export const DEFAULT_QUIET_HOURS: QuietHours = { start: '22:00', end: '08:00' }
export const DEFAULT_PREFERRED_CHANNELS: PreferredChannels = { push: true, email: false }
