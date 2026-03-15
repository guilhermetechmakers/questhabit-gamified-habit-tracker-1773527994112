-- Optional last_synced_at for offline sync tracking. Idempotent.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'habits' AND column_name = 'last_synced_at'
  ) THEN
    ALTER TABLE public.habits ADD COLUMN last_synced_at TIMESTAMPTZ;
  END IF;
END $$;
