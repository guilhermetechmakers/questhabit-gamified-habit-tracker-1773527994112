-- Analytics & Reporting: events, cohorts, export schedules, reports, privacy_settings.
-- Idempotent; safe to run multiple times.

-- Analytics events (product metrics and user events; reconciled with external trackers)
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

-- Cohorts (acquisition cohorts, retention by cohort, LTV)
CREATE TABLE IF NOT EXISTS public.analytics_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  user_ids UUID[] DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_cohorts_started_at ON public.analytics_cohorts(started_at DESC);

ALTER TABLE public.analytics_cohorts ENABLE ROW LEVEL SECURITY;

-- Export job status: add 'cancelled' and optional format/schedule (if columns missing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'export_job_status' AND e.enumlabel = 'cancelled'
  ) THEN
    ALTER TYPE export_job_status ADD VALUE 'cancelled';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'export_jobs' AND column_name = 'format'
  ) THEN
    ALTER TABLE public.export_jobs ADD COLUMN format TEXT DEFAULT 'json';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'export_jobs' AND column_name = 'schedule_id'
  ) THEN
    ALTER TABLE public.export_jobs ADD COLUMN schedule_id UUID;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'export_jobs' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.export_jobs ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- Export schedules (cron-like or interval-based)
CREATE TABLE IF NOT EXISTS public.analytics_export_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type TEXT NOT NULL,
  cron_expression TEXT,
  next_run TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_export_schedules_owner ON public.analytics_export_schedules(owner_id);
CREATE INDEX IF NOT EXISTS idx_analytics_export_schedules_next_run ON public.analytics_export_schedules(next_run) WHERE is_active = true;

ALTER TABLE public.analytics_export_schedules ENABLE ROW LEVEL SECURITY;

-- Reports (ad-hoc report templates with filters)
CREATE TABLE IF NOT EXISTS public.analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shared_with UUID[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_analytics_reports_owner ON public.analytics_reports(owner_id);

ALTER TABLE public.analytics_reports ENABLE ROW LEVEL SECURITY;

-- Privacy settings (opt-out and PII consent for analytics/reports)
CREATE TABLE IF NOT EXISTS public.analytics_privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  opt_out_analytics BOOLEAN NOT NULL DEFAULT false,
  pii_allowed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_privacy_settings ENABLE ROW LEVEL SECURITY;

-- RLS: Admin/analytics access via service role in Edge Functions only.
-- No direct client policies for analytics tables; all access through Edge Function.
COMMENT ON TABLE public.analytics_events IS 'Product and user events for analytics; PII flagged for redaction';
COMMENT ON TABLE public.analytics_cohorts IS 'Cohort definitions and computed metrics';
COMMENT ON TABLE public.analytics_export_schedules IS 'Scheduled export jobs (cron/interval)';
COMMENT ON TABLE public.analytics_reports IS 'Saved report templates with filters';
COMMENT ON TABLE public.analytics_privacy_settings IS 'User preferences for analytics and PII in exports';
