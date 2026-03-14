-- QuestHabit: notifications_log for delivery tracking; user push_token and timezone for reminders/scheduler.
-- Idempotent.

-- notifications_log: delivery status for push/email (server-side only)
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('delivered', 'failed', 'pending')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_log_user_id ON public.notifications_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_log_sent_at ON public.notifications_log(sent_at);

ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications_log" ON public.notifications_log;
CREATE POLICY "Users can read own notifications_log" ON public.notifications_log
  FOR SELECT USING (auth.uid() = user_id);

-- Service role / Edge Functions write; no INSERT policy for users (server-only writes)

-- Add push_token to users if not present (for FCM/APNs)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'push_token'
  ) THEN
    ALTER TABLE public.users ADD COLUMN push_token TEXT;
  END IF;
END $$;

-- Add timezone to users if not present (for reminder scheduling)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE public.users ADD COLUMN timezone TEXT DEFAULT 'UTC';
  END IF;
END $$;

-- Ensure notifications.payload_json can store title, message, related_habit_id (already JSONB)
-- No schema change needed; payload_json is flexible.
