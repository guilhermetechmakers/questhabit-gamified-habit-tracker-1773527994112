export type UserRole = 'user' | 'coach' | 'admin' | 'moderator' | 'support' | 'auditor'

export interface User {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  last_login: string | null
  subscription_id: string | null
  settings_json: Record<string, unknown> | null
  /** Set when admin is impersonating another user */
  impersonating_user_id?: string | null
}

export interface UpdateUserInput {
  id: string
  display_name?: string
  avatar_url?: string
  settings_json?: Record<string, unknown>
}
