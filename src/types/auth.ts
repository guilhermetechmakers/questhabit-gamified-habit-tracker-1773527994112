/** Auth audit log event types */
export type AuthAuditEvent =
  | 'signup'
  | 'login'
  | 'logout'
  | 'password_reset_requested'
  | 'password_changed'
  | 'email_verified'
  | 'email_verification_sent'
  | 'token_refreshed'
  | 'refresh_token_revoked'

export interface AuthAuditLog {
  id: string
  user_id: string | null
  event: AuthAuditEvent
  metadata: Record<string, unknown>
  created_at: string
}

export interface AuthAuditLogInsert {
  event: AuthAuditEvent
  user_id?: string | null
  metadata?: Record<string, unknown>
}
