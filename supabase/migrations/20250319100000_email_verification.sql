-- Email verification: tokens, resend cooldown, and email_verified flag.
-- Idempotent. Used with SendGrid for verification emails and token-based verify link.

-- Add email_verified to public.users (synced when token is used or Supabase confirms)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE public.users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Tokens: single-use, TTL (e.g. 15–30 min). Indexed by token for lookup.
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verification_tokens_token
  ON public.email_verification_tokens(token) WHERE used = false;
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id
  ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at
  ON public.email_verification_tokens(expires_at);

ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
-- No client policies; only service role / Edge Functions manage tokens
CREATE POLICY "No direct client access" ON public.email_verification_tokens FOR ALL USING (false);

COMMENT ON TABLE public.email_verification_tokens IS 'Single-use tokens for email verification; used by Edge Functions and SendGrid links.';

-- Resend cooldown per user (e.g. 60 seconds)
CREATE TABLE IF NOT EXISTS public.resend_cooldowns (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.resend_cooldowns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct client access" ON public.resend_cooldowns FOR ALL USING (false);

COMMENT ON TABLE public.resend_cooldowns IS 'Throttle resend verification email per user; updated by Edge Function.';
