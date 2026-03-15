import { supabase } from '@/lib/supabase'
import type { User as AppUser } from '@/types/user'

export const authApi = {
  /**
   * Get current user profile from public.users (display_name, avatar_url, role, etc.)
   */
  getMe: async (userId: string): Promise<AppUser | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, display_name, avatar_url, role, created_at, last_login, subscription_id, settings_json, impersonating_user_id')
      .eq('id', userId)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }
    if (!data) return null
    return {
      id: data.id,
      email: (data as { email?: string }).email ?? '',
      display_name: (data as { display_name?: string | null }).display_name ?? null,
      avatar_url: (data as { avatar_url?: string | null }).avatar_url ?? null,
      role: (data as { role?: AppUser['role'] }).role ?? 'user',
      created_at: (data as { created_at?: string }).created_at ?? new Date().toISOString(),
      last_login: (data as { last_login?: string | null }).last_login ?? null,
      subscription_id: (data as { subscription_id?: string | null }).subscription_id ?? null,
      settings_json: (data as { settings_json?: Record<string, unknown> | null }).settings_json ?? null,
      impersonating_user_id: (data as { impersonating_user_id?: string | null }).impersonating_user_id ?? null,
    }
  },

  updateLastLogin: async (userId: string): Promise<void> => {
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId)
  },
}
