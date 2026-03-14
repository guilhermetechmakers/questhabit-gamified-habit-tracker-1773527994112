/**
 * QuestHabit — Verify email via token (GET /auth-verify?token=xxx).
 * Validates token (TTL, single-use), marks used, sets user email_verified and Supabase email_confirm.
 * No Authorization required (token in query).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let token: string | null = null
  if (req.method === 'GET') {
    const url = new URL(req.url)
    token = url.searchParams.get('token')?.trim()
  } else {
    const body = (await req.json()) as { token?: string }
    token = typeof body.token === 'string' ? body.token.trim() : null
  }
  if (!token) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing token' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: row, error: fetchError } = await admin
      .from('email_verification_tokens')
      .select('id, user_id, expires_at, used')
      .eq('token', token)
      .limit(1)
      .single()

    if (fetchError || !row) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired link' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if ((row as { used?: boolean }).used) {
      return new Response(
        JSON.stringify({ success: false, error: 'This link has already been used' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const expiresAt = (row as { expires_at?: string }).expires_at
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Verification link has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = (row as { user_id?: string }).user_id
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await admin.from('email_verification_tokens').update({ used: true }).eq('id', (row as { id?: string }).id)

    const { data: userRow } = await admin.from('users').select('email_verified').eq('id', userId).single()
    if ((userRow as { email_verified?: boolean } | null)?.email_verified) {
      return new Response(
        JSON.stringify({ success: true, message: 'Email already verified' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await admin.from('users').update({ email_verified: true }).eq('id', userId)

    try {
      await admin.auth.admin.updateUserById(userId, { email_confirm: true })
    } catch {
      // Supabase may not expose email_confirm in all projects; profile flag is set
    }

    await admin.from('auth_audit_logs').insert({
      user_id: userId,
      event: 'email_verified',
      metadata: { source: 'token' },
    })

    return new Response(
      JSON.stringify({ success: true, message: 'Email verified' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
