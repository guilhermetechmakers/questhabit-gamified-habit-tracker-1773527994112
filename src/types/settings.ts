/**
 * User preferences for notifications, theme, sync, quiet hours.
 * Stored in public.users.settings_json or dedicated columns.
 */
export interface QuietHours {
  start: string // HH:mm 24h
  end: string   // HH:mm 24h
}

export interface PreferredChannels {
  push: boolean
  email: boolean
}

export type ThemePreference = 'light' | 'dark' | 'system'

export type SyncFrequency = 'auto' | 'manual' | 'interval'

export interface UserSettings {
  pushEnabled: boolean
  emailEnabled: boolean
  quietHours: QuietHours
  timezone: string
  theme: ThemePreference
  onboardingCompleted: boolean
  syncFrequency: SyncFrequency
  preferredChannels: PreferredChannels
}

export const DEFAULT_QUIET_HOURS: QuietHours = { start: '22:00', end: '07:00' }

export const DEFAULT_USER_SETTINGS: UserSettings = {
  pushEnabled: true,
  emailEnabled: false,
  quietHours: DEFAULT_QUIET_HOURS,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
  theme: 'system',
  onboardingCompleted: false,
  syncFrequency: 'auto',
  preferredChannels: { push: true, email: false },
}
