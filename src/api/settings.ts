import { supabase } from '@/lib/supabase'
import type { UserSettings } from '@/types/settings'
import { DEFAULT_USER_SETTINGS } from '@/types/settings'

const SETTINGS_KEYS: (keyof UserSettings)[] = [
  'pushEnabled',
  'emailEnabled',
  'quietHours',
  'timezone',
  'theme',
  'onboardingCompleted',
  'syncFrequency',
  'preferredChannels',
]

function parseSettingsJson(raw: unknown): UserSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_USER_SETTINGS }
  const o = raw as Record<string, unknown>
  return {
    pushEnabled: typeof o.pushEnabled === 'boolean' ? o.pushEnabled : DEFAULT_USER_SETTINGS.pushEnabled,
    emailEnabled: typeof o.emailEnabled === 'boolean' ? o.emailEnabled : DEFAULT_USER_SETTINGS.emailEnabled,
    quietHours:
      o.quietHours && typeof o.quietHours === 'object' && 'start' in o.quietHours && 'end' in o.quietHours
        ? (o.quietHours as UserSettings['quietHours'])
        : DEFAULT_USER_SETTINGS.quietHours,
    timezone: typeof o.timezone === 'string' ? o.timezone : DEFAULT_USER_SETTINGS.timezone,
    theme:
      o.theme === 'light' || o.theme === 'dark' || o.theme === 'system'
        ? o.theme
        : DEFAULT_USER_SETTINGS.theme,
    onboardingCompleted:
      typeof o.onboardingCompleted === 'boolean' ? o.onboardingCompleted : DEFAULT_USER_SETTINGS.onboardingCompleted,
    syncFrequency:
      o.syncFrequency === 'auto' || o.syncFrequency === 'manual' || o.syncFrequency === 'interval'
        ? o.syncFrequency
        : DEFAULT_USER_SETTINGS.syncFrequency,
    preferredChannels:
      o.preferredChannels && typeof o.preferredChannels === 'object'
        ? {
            push: typeof (o.preferredChannels as { push?: boolean }).push === 'boolean'
              ? (o.preferredChannels as { push: boolean }).push
              : DEFAULT_USER_SETTINGS.preferredChannels.push,
            email: typeof (o.preferredChannels as { email?: boolean }).email === 'boolean'
              ? (o.preferredChannels as { email: boolean }).email
              : DEFAULT_USER_SETTINGS.preferredChannels.email,
          }
        : DEFAULT_USER_SETTINGS.preferredChannels,
  }
}

function toSettingsJson(settings: Partial<UserSettings>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of SETTINGS_KEYS) {
    const v = settings[key]
    if (v !== undefined) out[key] = v
  }
  return out
}

export const settingsApi = {
  get: async (userId: string): Promise<UserSettings> => {
    const { data, error } = await supabase
      .from('users')
      .select('settings_json')
      .eq('id', userId)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return { ...DEFAULT_USER_SETTINGS }
      throw new Error(error.message)
    }
    return parseSettingsJson((data as { settings_json?: unknown })?.settings_json)
  },

  update: async (userId: string, updates: Partial<UserSettings>): Promise<UserSettings> => {
    const { data: current, error: fetchError } = await supabase
      .from('users')
      .select('settings_json')
      .eq('id', userId)
      .single()
    if (fetchError && fetchError.code !== 'PGRST116') throw new Error(fetchError.message)
    const currentSettings = parseSettingsJson((current as { settings_json?: unknown })?.settings_json)
    const merged: UserSettings = { ...currentSettings, ...updates }
    const payload: Record<string, unknown> = toSettingsJson(merged)
    const { error: updateError } = await supabase
      .from('users')
      .update({ settings_json: payload })
      .eq('id', userId)
    if (updateError) throw new Error(updateError.message)
    return merged
  },
}
