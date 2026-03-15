-- Analytics & Reporting: events, cohorts view, export schedules, reports, privacy settings.
-- Idempotent; safe to run multiple times.

-- Analytics events (product metrics and user events; reconciled with Amplitude/GA4 server-side)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'web',
  properties JSONB DEFAULT '{}',
  pii_flag BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON public.analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_source ON public.analytics_events(source);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS: no direct client access; Edge Functions use service role.
CREATE POLICY "Service role only for analytics_events" ON public.analytics_events
  FOR ALL USING (false);

-- Export schedules (cron-like or interval-based recurring exports)
CREATE TABLE IF NOT EXISTS public.export_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'csv' CHECK (format IN ('csv', 'json')),
  cron_expression TEXT,
  next_run TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  filters JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_export_schedules_owner ON public.export_schedules(owner_id);
CREATE INDEX IF NOT EXISTS idx_export_schedules_next_run ON public.export_schedules(next_run) WHERE is_active = true;

ALTER TABLE public.export_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for export_schedules" ON public.export_schedules
  FOR ALL USING (false);

-- Extend export_jobs with format, schedule_id, filters (if columns missing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'export_jobs' AND column_name = 'format'
  ) THEN
    ALTER TABLE public.export_jobs ADD COLUMN format TEXT DEFAULT 'csv' CHECK (format IN ('csv', 'json'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'export_jobs' AND column_name = 'schedule_id'
  ) THEN
    ALTER TABLE public.export_jobs ADD COLUMN schedule_id UUID REFERENCES public.export_schedules(id) ON DELETE SET NULL;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'export_jobs' AND column_name = 'filters'
  ) THEN
    ALTER TABLE public.export_jobs ADD COLUMN filters JSONB DEFAULT '{}';
  END IF;
END $$;

-- Add cancelled to export_job_status if needed (optional; existing enum may not have it)
-- Using existing enum; status 'cancelled' can be represented as 'failed' or add enum value via separate migration if required.

-- Reports (saved ad-hoc report templates)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shared_with UUID[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_reports_owner_id ON public.reports(owner_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for reports" ON public.reports
  FOR ALL USING (false);

-- Privacy settings (per-user opt-out and PII consent for analytics/exports)
CREATE TABLE IF NOT EXISTS public.privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  opt_out_analytics BOOLEAN NOT NULL DEFAULT false,
  pii_allowed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own privacy_settings" ON public.privacy_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own privacy_settings" ON public.privacy_settings
  FOR ALL USING (auth.uid() = user_id);
