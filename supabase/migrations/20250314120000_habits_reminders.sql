-- QuestHabit: reminders table and habit extensions (description, goal, timezone).
-- Idempotent.

-- Add optional columns to habits if not present
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'habits' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.habits ADD COLUMN description TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'habits' AND column_name = 'goal'
  ) THEN
    ALTER TABLE public.habits ADD COLUMN goal TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'habits' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE public.habits ADD COLUMN timezone TEXT DEFAULT 'UTC';
  END IF;
END $$;

-- reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  time_of_day TEXT NOT NULL,
  offset_minutes INT NOT NULL DEFAULT 0,
  repeats TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  next_due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_habit_id ON public.reminders(habit_id);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD reminders for own habits" ON public.reminders;
CREATE POLICY "Users can CRUD reminders for own habits" ON public.reminders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.habits h WHERE h.id = reminders.habit_id AND h.user_id = auth.uid())
  );
