-- QuestHabit billing audit trail. Idempotent.
-- Records plan changes, cancellations, reactivations, and payment method updates.

CREATE TABLE IF NOT EXISTS public.billing_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_audit_logs_user_id ON public.billing_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_audit_logs_created_at ON public.billing_audit_logs(created_at DESC);

ALTER TABLE public.billing_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own billing audit logs"
  ON public.billing_audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Insert only via service role (Edge Functions)
CREATE POLICY "No direct insert for users"
  ON public.billing_audit_logs FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct update for users"
  ON public.billing_audit_logs FOR UPDATE
  USING (false);

CREATE POLICY "No direct delete for users"
  ON public.billing_audit_logs FOR DELETE
  USING (false);

COMMENT ON TABLE public.billing_audit_logs IS 'Audit trail for subscription and billing actions; written by Edge Functions only.';
