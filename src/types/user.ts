export type UserRole = 'user' | 'coach' | 'admin'

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
}

export interface UpdateUserInput {
  id: string
  display_name?: string
  avatar_url?: string
  settings_json?: Record<string, unknown>
}
