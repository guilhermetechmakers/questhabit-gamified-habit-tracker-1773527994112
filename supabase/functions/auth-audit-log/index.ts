/**
 * QuestHabit auth audit logging Edge Function.
 * Logs authentication events (signup, login, logout, password_reset_requested,
 * password_changed, email_verified, token_refreshed) to auth_audit_logs.
 * Called by the client after auth actions. Uses JWT to identify user.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const ALLOWED_EVENTS = [
  'signup',
  'login',
  'logout',
  'password_reset_requested',
  'password_changed',
  'email_verified',
  'email_verification_sent',
  'token_refreshed',
  'refresh_token_revoked',
] as const

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      authHeader ? { global: { headers: { Authorization: authHeader } } } : {}
    )

    const body = (await req.json()) as { event: string; metadata?: Record<string, unknown> }
    const event = typeof body.event === 'string' ? body.event.trim() : ''
    const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : {}

    if (!event || !ALLOWED_EVENTS.includes(event as (typeof ALLOWED_EVENTS)[number])) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing event' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let userId: string | null = null
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      )
      userId = user?.id ?? null
    }

    const payload = {
      user_id: userId,
      event,
      metadata: {
        ...metadata,
        user_agent: req.headers.get('user-agent') ?? undefined,
      },
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const { error } = await supabaseAdmin.from('auth_audit_logs').insert(payload)

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
