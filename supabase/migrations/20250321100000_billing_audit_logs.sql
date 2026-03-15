-- Billing audit logs for subscription and payment operations. Idempotent.
-- Events: plan_change, cancellation, reactivation, payment_method_attach, payment_method_detach, payment_method_set_default

CREATE TABLE IF NOT EXISTS public.billing_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_audit_logs_user_id ON public.billing_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_audit_logs_created_at ON public.billing_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_billing_audit_logs_action ON public.billing_audit_logs(action);

ALTER TABLE public.billing_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role / edge functions write; users can read own logs
CREATE POLICY "Users can read own billing_audit_logs" ON public.billing_audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- No direct client INSERT/UPDATE/DELETE; edge functions use service role
CREATE POLICY "No client write billing_audit_logs" ON public.billing_audit_logs
  FOR ALL USING (false);

COMMENT ON TABLE public.billing_audit_logs IS 'Audit trail for billing operations; populated by payments Edge Functions';
