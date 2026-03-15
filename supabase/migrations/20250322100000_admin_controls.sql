-- Admin Controls: RBAC, audit, moderation, refunds, impersonation, exports.
-- Idempotent; safe to run multiple times.

-- Extend user_role with admin roles (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'user_role' AND e.enumlabel = 'moderator') THEN
    ALTER TYPE user_role ADD VALUE 'moderator';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'user_role' AND e.enumlabel = 'support') THEN
    ALTER TYPE user_role ADD VALUE 'support';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'user_role' AND e.enumlabel = 'auditor') THEN
    ALTER TYPE user_role ADD VALUE 'auditor';
  END IF;
END $$;

-- User status enum for suspend/soft-delete
DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted', 'pending');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add status and impersonation to users (if columns missing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.users ADD COLUMN status user_status NOT NULL DEFAULT 'active';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'impersonating_user_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN impersonating_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Admin audit_logs (detailed admin actions for undo/audit trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_user_id ON public.audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Refunds
DO $$ BEGIN
  CREATE TYPE refund_status AS ENUM ('pending', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_cents INT NOT NULL,
  reason TEXT,
  status refund_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON public.refunds(user_id);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Moderation reports
DO $$ BEGIN
  CREATE TYPE moderation_report_status AS ENUM ('open', 'in_review', 'resolved');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.moderation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_snippet TEXT,
  reported_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status moderation_report_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_moderation_reports_status ON public.moderation_reports(status);

ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;

-- Content items (for featuring/pin/visibility)
DO $$ BEGIN
  CREATE TYPE content_status AS ENUM ('active', 'removed', 'flagged');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT,
  status content_status NOT NULL DEFAULT 'active',
  featured_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_items_owner_id ON public.content_items(owner_id);

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- Impersonation sessions
CREATE TABLE IF NOT EXISTS public.impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  impersonated_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_admin ON public.impersonation_sessions(admin_user_id);

ALTER TABLE public.impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- Export jobs
DO $$ BEGIN
  CREATE TYPE export_job_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  status export_job_status NOT NULL DEFAULT 'pending',
  initiated_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  file_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_export_jobs_initiated_by ON public.export_jobs(initiated_by);

ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;

-- Soft delete records (for restore/audit)
CREATE TABLE IF NOT EXISTS public.soft_deletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  restored_at TIMESTAMPTZ,
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_soft_deletes_user_id ON public.soft_deletes(user_id);

ALTER TABLE public.soft_deletes ENABLE ROW LEVEL SECURITY;

-- Admin settings (IP allowlist, MFA, feature flags)
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_allowlist TEXT[] DEFAULT '{}',
  mfa_required BOOLEAN NOT NULL DEFAULT true,
  impersonation_enabled BOOLEAN NOT NULL DEFAULT true,
  audit_logging_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- RLS: admin/auditor access via service role in Edge Functions only; no direct client policies for admin tables.
-- Application uses Edge Functions with service role for admin operations.
