/**
 * QuestHabit Admin Edge Function.
 * Accepts body: { path, method, body?, query? }. Routes by path; RBAC enforced.
 * Uses service role for DB. Paths: dashboard-metrics, users, users/:id, users/:id/suspend, etc.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const ADMIN_ROLES = ['admin', 'moderator', 'support', 'auditor'] as const
const WRITE_ADMIN_ROLES = ['admin', 'moderator'] as const

async function getAdminUser(req: Request): Promise<{ id: string; role: string } | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace(/^Bearer\s+/i, ''))
  if (!user?.id) return null
  const { data: profile } = await supabase.from('users').select('id, role').eq('id', user.id).single()
  const role = (profile as { role?: string } | null)?.role
  if (!role || !ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])) return null
  return { id: user.id, role }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const admin = await getAdminUser(req)
  if (!admin) return json({ error: 'Forbidden' }, 403)

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const adminClient = createClient(supabaseUrl, serviceKey)

  let payload: { path?: string; method?: string; body?: Record<string, unknown>; query?: Record<string, string> }
  try {
    payload = (await req.json()) as typeof payload
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const path = typeof payload.path === 'string' ? payload.path : ''
  const method = (payload.method as string) ?? 'GET'
  const body = payload.body && typeof payload.body === 'object' ? payload.body : {}
  const query = payload.query && typeof payload.query === 'object' ? payload.query : {}

  const canWrite = WRITE_ADMIN_ROLES.includes(admin.role as (typeof WRITE_ADMIN_ROLES)[number])

  try {
    // GET dashboard-metrics
    if (path === 'dashboard-metrics' && method === 'GET') {
      const [activeRes, suspendedRes, refundsRes, reportsRes] = await Promise.all([
        adminClient.from('users').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        adminClient.from('users').select('id', { count: 'exact', head: true }).eq('status', 'suspended'),
        adminClient.from('refunds').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        adminClient.from('moderation_reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      ])
      const activeUsers = (activeRes as { count?: number })?.count ?? 0
      const suspendedUsers = (suspendedRes as { count?: number })?.count ?? 0
      const pendingRefunds = (refundsRes as { count?: number })?.count ?? 0
      const openReports = (reportsRes as { count?: number })?.count ?? 0
      return json({
        totalUsers: activeUsers + suspendedUsers,
        activeUsers,
        suspendedUsers,
        openReports,
        recentRefundsTotalCents: 0,
        fraudFlags: 0,
      })
    }

    // GET users
    if (path === 'users' && method === 'GET') {
      const q = query.q ?? ''
      const status = query.status ?? ''
      const role = query.role ?? ''
      const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1)
      const pageSize = Math.min(50, Math.max(1, parseInt(query.pageSize ?? '20', 10) || 20))
      let qb = adminClient.from('users').select('id, email, display_name, role, status, last_login, created_at', { count: 'exact' })
      if (status) qb = qb.eq('status', status)
      if (role) qb = qb.eq('role', role)
      if (q) qb = qb.or(`email.ilike.%${q}%,display_name.ilike.%${q}%`)
      const { data: rows, error, count } = await qb.range((page - 1) * pageSize, page * pageSize - 1)
      if (error) return json({ error: error.message }, 500)
      const data = (rows ?? []).map((r: Record<string, unknown>) => ({
        id: r.id,
        email: r.email ?? '',
        display_name: r.display_name ?? null,
        role: r.role ?? 'user',
        status: r.status ?? 'active',
        last_login: r.last_login ?? null,
        created_at: r.created_at ?? new Date().toISOString(),
        updated_at: null,
      }))
      return json({ data, count: count ?? data.length, page, pageSize })
    }

    // GET users/:id
    if (path.startsWith('users/') && method === 'GET') {
      const id = path.replace(/^users\//, '').replace(/\/.*$/, '')
      if (!id) return json({ error: 'Missing user id' }, 400)
      const { data: row, error } = await adminClient.from('users').select('*').eq('id', id).single()
      if (error || !row) return json({ error: 'User not found' }, 404)
      const r = row as Record<string, unknown>
      return json({
        id: r.id,
        email: r.email ?? '',
        display_name: r.display_name ?? null,
        role: r.role ?? 'user',
        status: r.status ?? 'active',
        last_login: r.last_login ?? null,
        created_at: r.created_at ?? new Date().toISOString(),
        updated_at: r.updated_at ?? null,
      })
    }

    // POST users/:id/suspend
    if (path.includes('/suspend') && method === 'POST' && canWrite) {
      const id = (body.userId as string) ?? path.match(/users\/([^/]+)/)?.[1] ?? ''
      if (!id) return json({ error: 'Missing user id' }, 400)
      const { error } = await adminClient.from('users').update({ status: 'suspended' }).eq('id', id)
      if (error) return json({ error: error.message }, 500)
      await adminClient.from('audit_logs').insert({
        admin_user_id: admin.id,
        action: 'suspend',
        target_type: 'user',
        target_id: id,
        detail: (body.reason as string) ?? null,
      })
      return json({ success: true })
    }

    // POST users/:id/restore
    if (path.includes('/restore') && method === 'POST' && canWrite) {
      const id = (body.userId as string) ?? path.match(/users\/([^/]+)/)?.[1] ?? ''
      if (!id) return json({ error: 'Missing user id' }, 400)
      const { error } = await adminClient.from('users').update({ status: 'active' }).eq('id', id)
      if (error) return json({ error: error.message }, 500)
      await adminClient.from('audit_logs').insert({
        admin_user_id: admin.id,
        action: 'restore',
        target_type: 'user',
        target_id: id,
        detail: null,
      })
      return json({ success: true })
    }

    // POST users/:id/soft-delete
    if (path.includes('/soft-delete') && method === 'POST' && canWrite) {
      const id = (body.userId as string) ?? path.match(/users\/([^/]+)/)?.[1] ?? ''
      if (!id) return json({ error: 'Missing user id' }, 400)
      const { error } = await adminClient.from('users').update({ status: 'deleted' }).eq('id', id)
      if (error) return json({ error: error.message }, 500)
      await adminClient.from('soft_deletes').insert({ user_id: id, reason: (body.reason as string) ?? null })
      await adminClient.from('audit_logs').insert({
        admin_user_id: admin.id,
        action: 'soft-delete',
        target_type: 'user',
        target_id: id,
        detail: (body.reason as string) ?? null,
      })
      return json({ success: true })
    }

    // POST users/:id/restore-soft-delete
    if (path.includes('/restore-soft-delete') && method === 'POST' && canWrite) {
      const id = (body.userId as string) ?? path.match(/users\/([^/]+)/)?.[1] ?? ''
      if (!id) return json({ error: 'Missing user id' }, 400)
      const { error } = await adminClient.from('users').update({ status: 'active' }).eq('id', id)
      if (error) return json({ error: error.message }, 500)
      await adminClient.from('soft_deletes').update({ restored_at: new Date().toISOString() }).eq('user_id', id).is('restored_at', null)
      await adminClient.from('audit_logs').insert({
        admin_user_id: admin.id,
        action: 'restore-soft-delete',
        target_type: 'user',
        target_id: id,
        detail: null,
      })
      return json({ success: true })
    }

    // POST users/:id/export
    if (path.includes('/export') && method === 'POST' && canWrite) {
      const id = (body.userId as string) ?? path.match(/users\/([^/]+)/)?.[1] ?? ''
      if (!id) return json({ error: 'Missing user id' }, 400)
      const { data: jobRows, error } = await adminClient.from('export_jobs').insert({
        type: 'user_data',
        status: 'pending',
        initiated_by: admin.id,
      }).select('id')
      const job = Array.isArray(jobRows) && jobRows.length > 0 ? jobRows[0] : null
      const jobId = (job as { id?: string } | null)?.id ?? ''
      if (error) return json({ error: error.message }, 500)
      await adminClient.from('audit_logs').insert({
        admin_user_id: admin.id,
        action: 'export-user',
        target_type: 'user',
        target_id: id,
        detail: jobId || null,
      })
      return json({ jobId })
    }

    // POST refund
    if (path === 'refund' && method === 'POST' && admin.role === 'admin') {
      const userId = body.userId as string
      const amount = Number(body.amount)
      const reason = body.reason as string
      if (!userId || !Number.isFinite(amount)) return json({ error: 'Invalid payload' }, 400)
      const { error } = await adminClient.from('refunds').insert({
        user_id: userId,
        amount_cents: Math.round(amount),
        reason: reason ?? null,
        status: 'pending',
        approved_by: admin.id,
      })
      if (error) return json({ error: error.message }, 500)
      await adminClient.from('audit_logs').insert({
        admin_user_id: admin.id,
        action: 'refund',
        target_type: 'user',
        target_id: userId,
        detail: `${amount} ${reason ?? ''}`,
      })
      return json({ success: true })
    }

    // GET audit-logs
    if (path === 'audit-logs' && method === 'GET') {
      const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1)
      const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize ?? '20', 10) || 20))
      const { data: rows, error, count } = await adminClient
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)
      if (error) return json({ error: error.message }, 500)
      const data = (rows ?? []).map((r: Record<string, unknown>) => ({
        id: r.id,
        admin_user_id: r.admin_user_id,
        action: r.action,
        target_type: r.target_type,
        target_id: r.target_id,
        detail: r.detail,
        created_at: r.created_at,
      }))
      return json({ data, count: count ?? data.length, page, pageSize })
    }

    // GET moderation/queue
    if (path === 'moderation/queue' && method === 'GET') {
      const { data: rows, error } = await adminClient
        .from('moderation_reports')
        .select('*')
        .in('status', ['open', 'in_review'])
        .order('created_at', { ascending: false })
      if (error) return json({ error: error.message }, 500)
      const data = (rows ?? []).map((r: Record<string, unknown>) => ({
        id: r.id,
        content_id: r.content_id,
        content_snippet: r.content_snippet,
        reported_by: r.reported_by,
        reason: r.reason ?? null,
        status: r.status,
        created_at: r.created_at,
        resolved_at: r.resolved_at,
      }))
      return json({ data })
    }

    // POST moderation/actions
    if (path === 'moderation/actions' && method === 'POST' && canWrite) {
      const itemId = body.itemId as string
      const action = body.action as string
      const notes = body.notes as string
      if (!itemId || !action) return json({ error: 'Missing itemId or action' }, 400)
      await adminClient.from('moderation_reports').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', itemId)
      await adminClient.from('audit_logs').insert({
        admin_user_id: admin.id,
        action: `moderation:${action}`,
        target_type: 'moderation_report',
        target_id: itemId,
        detail: notes ?? null,
      })
      return json({ success: true })
    }

    // POST content/feature
    if (path === 'content/feature' && method === 'POST' && admin.role === 'admin') {
      const contentId = body.contentId as string
      const featureUntil = body.featureUntil as string
      if (!contentId) return json({ error: 'Missing contentId' }, 400)
      const { error } = await adminClient.from('content_items').update({ featured_until: featureUntil ?? null }).eq('id', contentId)
      if (error) return json({ error: error.message }, 500)
      await adminClient.from('audit_logs').insert({
        admin_user_id: admin.id,
        action: 'content-feature',
        target_type: 'content',
        target_id: contentId,
        detail: featureUntil ?? null,
      })
      return json({ success: true })
    }

    // POST impersonate
    if (path === 'impersonate' && method === 'POST' && admin.role === 'admin') {
      const userId = body.userId as string
      if (!userId) return json({ error: 'Missing userId' }, 400)
      const { error } = await adminClient.from('users').update({ impersonating_user_id: userId }).eq('id', admin.id)
      if (error) return json({ error: error.message }, 500)
      await adminClient.from('impersonation_sessions').insert({
        admin_user_id: admin.id,
        impersonated_user_id: userId,
      })
      return json({ success: true })
    }

    // POST impersonation/stop
    if (path === 'impersonation/stop' && method === 'POST' && admin.role === 'admin') {
      const { data: session } = await adminClient.from('impersonation_sessions').select('id').eq('admin_user_id', admin.id).is('ended_at', null).limit(1).single()
      if (session) {
        await adminClient.from('impersonation_sessions').update({ ended_at: new Date().toISOString() }).eq('id', (session as { id: string }).id)
      }
      await adminClient.from('users').update({ impersonating_user_id: null }).eq('id', admin.id)
      return json({ success: true })
    }

    // GET exports/:jobId/status
    if (path.startsWith('exports/') && path.endsWith('/status') && method === 'GET') {
      const jobId = path.replace('exports/', '').replace('/status', '')
      if (!jobId) return json({ error: 'Missing jobId' }, 400)
      const { data: job, error } = await adminClient.from('export_jobs').select('*').eq('id', jobId).single()
      if (error || !job) return json({ error: 'Job not found' }, 404)
      const j = job as Record<string, unknown>
      return json({
        id: j.id,
        type: j.type,
        status: j.status,
        initiated_by: j.initiated_by,
        created_at: j.created_at,
        completed_at: j.completed_at,
        file_url: j.file_url,
      })
    }

    return json({ error: 'Unknown path' }, 404)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Internal error' }, 500)
  }
})
