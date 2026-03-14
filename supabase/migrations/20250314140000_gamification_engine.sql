-- QuestHabit Gamification Engine: levels, habit_streaks, rewards, config, events_log.
-- Idempotent.

-- levels (configurable XP thresholds per level)
CREATE TABLE IF NOT EXISTS public.levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_number INT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  required_xp INT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_levels_level_number ON public.levels(level_number);
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Levels readable by all" ON public.levels FOR SELECT USING (true);

-- Seed default levels (100, 220, 364, ...)
INSERT INTO public.levels (level_number, name, required_xp, sort_order)
VALUES
  (1, 'Starter', 0, 1),
  (2, 'Rookie', 100, 2),
  (3, 'Regular', 220, 3),
  (4, 'Dedicated', 364, 4),
  (5, 'Champion', 537, 5)
ON CONFLICT (level_number) DO NOTHING;

-- habit_streaks (per-habit streak tracking)
CREATE TABLE IF NOT EXISTS public.habit_streaks (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, habit_id)
);

CREATE INDEX IF NOT EXISTS idx_habit_streaks_user ON public.habit_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_streaks_habit ON public.habit_streaks(habit_id);
ALTER TABLE public.habit_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own habit_streaks" ON public.habit_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own habit_streaks" ON public.habit_streaks FOR ALL USING (auth.uid() = user_id);

-- rewards (catalog of redeemable items)
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  reward_type TEXT NOT NULL DEFAULT 'cosmetic',
  points_cost INT NOT NULL DEFAULT 0,
  badge_id UUID REFERENCES public.badges(id) ON DELETE SET NULL,
  icon_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rewards readable by all" ON public.rewards FOR SELECT USING (true);

-- user_rewards (redemption history)
CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_rewards_user ON public.user_rewards(user_id);
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own user_rewards" ON public.user_rewards FOR SELECT USING (auth.uid() = user_id);

-- gamification_config (key-value for XP rules, level thresholds, badge criteria, etc.)
CREATE TABLE IF NOT EXISTS public.gamification_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gamification_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Config readable by authenticated" ON public.gamification_config FOR SELECT USING (auth.role() = 'authenticated');
-- PATCH/update only via service role or admin (no policy = deny for anon/authenticated)

-- Seed default config (value as JSONB: numbers)
INSERT INTO public.gamification_config (key, value)
VALUES
  ('xp_per_level_base', '100'::jsonb),
  ('level_multiplier', '1.2'::jsonb),
  ('points_per_completion', '1'::jsonb),
  ('max_completions_per_day_per_habit', '1'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- events_log (audit and analytics)
CREATE TABLE IF NOT EXISTS public.events_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_log_user ON public.events_log(user_id);
CREATE INDEX IF NOT EXISTS idx_events_log_created ON public.events_log(created_at);
ALTER TABLE public.events_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own events_log" ON public.events_log FOR SELECT USING (auth.uid() = user_id);
-- Insert from service role / edge only (no INSERT policy for users = only backend writes)

-- Add rewards_points to user_stats
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_stats' AND column_name = 'rewards_points'
  ) THEN
    ALTER TABLE public.user_stats ADD COLUMN rewards_points INT NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Idempotency: optional idempotency_key on completions (client sends completion_id to avoid duplicates)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'completions' AND column_name = 'idempotency_key'
  ) THEN
    ALTER TABLE public.completions ADD COLUMN idempotency_key TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_completions_idempotency ON public.completions(user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
  END IF;
END $$;

-- Allow events_log insert from authenticated users (edge runs as user context when using anon key + Authorization)
DROP POLICY IF EXISTS "Users can read own events_log" ON public.events_log;
CREATE POLICY "Users can read own events_log" ON public.events_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert events_log" ON public.events_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seed example badges with criteria for gamification engine (run once)
INSERT INTO public.badges (name, criteria_json, rarity)
SELECT 'First Step', '{"first_completion": true}'::jsonb, 'common'
WHERE NOT EXISTS (SELECT 1 FROM public.badges WHERE name = 'First Step');
INSERT INTO public.badges (name, criteria_json, rarity)
SELECT 'Week Warrior', '{"streak_days": 7}'::jsonb, 'uncommon'
WHERE NOT EXISTS (SELECT 1 FROM public.badges WHERE name = 'Week Warrior');
