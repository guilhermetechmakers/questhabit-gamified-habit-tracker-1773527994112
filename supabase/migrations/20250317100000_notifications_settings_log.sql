-- QuestHabit: Notifications center fields, user notification settings, and delivery log.
-- Idempotent.

-- Add optional columns to notifications for in-app center (title, message, related_habit_id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'title'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN title TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'message'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN message TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'related_habit_id'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN related_habit_id UUID REFERENCES public.habits(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_related_habit ON public.notifications(related_habit_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_created ON public.notifications(user_id, read, created_at DESC);

-- User notification settings (channels, quiet hours, theme, sync)
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TEXT,
  quiet_hours_end TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  sync_frequency TEXT NOT NULL DEFAULT 'auto' CHECK (sync_frequency IN ('auto', 'manual', 'interval')),
  preferred_channels JSONB NOT NULL DEFAULT '{"push": true, "email": false}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own notification settings" ON public.user_notification_settings;
CREATE POLICY "Users can CRUD own notification settings" ON public.user_notification_settings
  FOR ALL USING (auth.uid() = user_id);

-- Notifications log for delivery tracking (delivered, failed, pending)
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('delivered', 'failed', 'pending')),
  error TEXT,
  related_habit_id UUID REFERENCES public.habits(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_log_user_sent ON public.notifications_log(user_id, sent_at DESC);

ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications log" ON public.notifications_log;
CREATE POLICY "Users can read own notifications log" ON public.notifications_log
  FOR SELECT USING (auth.uid() = user_id);

-- Reminders: add last_sent_at for scheduler (optional)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reminders' AND column_name = 'last_sent_at'
  ) THEN
    ALTER TABLE public.reminders ADD COLUMN last_sent_at TIMESTAMPTZ;
  END IF;
END $$;
