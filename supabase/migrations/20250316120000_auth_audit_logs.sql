-- Auth audit logs for authentication events. Idempotent.
-- Events: signup, login, logout, password_reset_requested, password_changed, email_verified, token_refreshed, refresh_token_revoked

CREATE TABLE IF NOT EXISTS public.auth_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_user_id ON public.auth_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_created_at ON public.auth_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_audit_logs_event ON public.auth_audit_logs(event);

ALTER TABLE public.auth_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role or edge function (service role) can insert; no direct client insert
-- Admins read via service role or dedicated admin RPC
CREATE POLICY "No direct client access" ON public.auth_audit_logs FOR ALL USING (false);

COMMENT ON TABLE public.auth_audit_logs IS 'Audit trail for auth events; populated by Edge Function auth-audit-log';
