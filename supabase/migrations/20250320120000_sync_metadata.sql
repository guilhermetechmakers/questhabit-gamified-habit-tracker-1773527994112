-- QuestHabit: sync metadata for offline sync (server version, last modified).
-- Idempotent.

CREATE TABLE IF NOT EXISTS public.sync_metadata (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  server_version BIGINT NOT NULL DEFAULT 0,
  last_modified TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own sync_metadata" ON public.sync_metadata;
CREATE POLICY "Users can read own sync_metadata" ON public.sync_metadata
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sync_metadata" ON public.sync_metadata;
CREATE POLICY "Users can update own sync_metadata" ON public.sync_metadata
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE public.sync_metadata IS 'Tracks last server version and lastModified for offline sync conflict detection';
