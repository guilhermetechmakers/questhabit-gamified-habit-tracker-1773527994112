-- QuestHabit Gamification Engine: config, events_log, rewards, reward_points.
-- Idempotent.

-- gamification_config: central config for XP rules, level thresholds, badge criteria, challenge rules
CREATE TABLE IF NOT EXISTS public.gamification_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gamification_config_key ON public.gamification_config(key);

ALTER TABLE public.gamification_config ENABLE ROW LEVEL SECURITY;

-- Config readable by all authenticated; only service role / admin can update (no INSERT/UPDATE policy = deny for anon)
CREATE POLICY "Config readable by authenticated" ON public.gamification_config
  FOR SELECT USING (auth.role() = 'authenticated');

-- events_log: audit and fraud detection
CREATE TABLE IF NOT EXISTS public.events_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_log_user_id ON public.events_log(user_id);
CREATE INDEX IF NOT EXISTS idx_events_log_created_at ON public.events_log(created_at);
CREATE INDEX IF NOT EXISTS idx_events_log_event_type ON public.events_log(event_type);

ALTER TABLE public.events_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own events" ON public.events_log FOR SELECT USING (auth.uid() = user_id);
-- Edge Functions insert with user JWT; restrict to own user_id via application logic
CREATE POLICY "Authenticated can insert own events" ON public.events_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- reward_points on user_stats
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_stats' AND column_name = 'reward_points'
  ) THEN
    ALTER TABLE public.user_stats ADD COLUMN reward_points INT NOT NULL DEFAULT 0;
  END IF;
END $$;

-- rewards: store items (cosmetic badges, boosts)
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  reward_type TEXT NOT NULL DEFAULT 'cosmetic',
  points_cost INT NOT NULL DEFAULT 0,
  icon_url TEXT,
  metadata_json JSONB DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rewards readable by all" ON public.rewards FOR SELECT USING (active = true);

-- reward_redemptions: user redemptions
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  points_spent INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON public.reward_redemptions(user_id);

ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own redemptions" ON public.reward_redemptions FOR SELECT USING (auth.uid() = user_id);

-- RPC: redeem reward (deduct points, insert redemption). Called by Edge Function or client with user JWT.
CREATE OR REPLACE FUNCTION public.redeem_reward(p_user_id UUID, p_reward_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points_cost INT;
  v_current_points INT;
  v_reward_name TEXT;
BEGIN
  IF p_user_id IS NULL OR p_reward_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'user_id and reward_id required');
  END IF;
  IF p_user_id != auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Unauthorized');
  END IF;

  SELECT points_cost, name INTO v_points_cost, v_reward_name
  FROM public.rewards WHERE id = p_reward_id AND active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Reward not found');
  END IF;

  SELECT COALESCE(reward_points, 0) INTO v_current_points
  FROM public.user_stats WHERE user_id = p_user_id;
  IF v_current_points IS NULL THEN
    v_current_points := 0;
  END IF;
  IF v_current_points < v_points_cost THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Insufficient points');
  END IF;

  UPDATE public.user_stats
  SET reward_points = COALESCE(reward_points, 0) - v_points_cost
  WHERE user_id = p_user_id;

  INSERT INTO public.reward_redemptions (user_id, reward_id, points_spent)
  VALUES (p_user_id, p_reward_id, v_points_cost);

  RETURN jsonb_build_object('ok', true, 'reward_name', v_reward_name, 'points_spent', v_points_cost);
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_reward(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_reward(UUID, UUID) TO service_role;

-- habit_streaks: per-habit streak (optional, for richer analytics)
CREATE TABLE IF NOT EXISTS public.habit_streaks (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, habit_id)
);

CREATE INDEX IF NOT EXISTS idx_habit_streaks_user_id ON public.habit_streaks(user_id);

ALTER TABLE public.habit_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own habit_streaks" ON public.habit_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own habit_streaks" ON public.habit_streaks FOR ALL USING (auth.uid() = user_id);

-- Seed default gamification config (value is JSONB)
INSERT INTO public.gamification_config (key, value) VALUES
  ('xp_per_level_base', '100'::jsonb),
  ('level_multiplier', '1.2'::jsonb),
  ('reward_points_per_xp', '0.1'::jsonb),
  ('level_thresholds', '[0, 100, 220, 364, 537, 744, 993, 1290, 1641, 2054]'::jsonb)
ON CONFLICT (key) DO NOTHING;
