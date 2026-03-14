/**
 * QuestHabit — Send email verification after signup.
 * Creates a single-use token, stores it, sends verification email via SendGrid.
 * POST, requires Authorization. Called by client after signUp success.
 * Secrets: SENDGRID_API_KEY. Optional: SENDGRID_FROM_EMAIL, VERIFY_EMAIL_ORIGIN.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { sendVerificationEmail, getVerifyLink } from '../_shared/sendgrid-verification.ts'

const TOKEN_TTL_MINUTES = 30
const COOLDOWN_SECONDS = 60

function generateToken(): string {
  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user?.email) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check cooldown
    const { data: cooldownRow } = await admin
      .from('resend_cooldowns')
      .select('last_sent_at')
      .eq('user_id', user.id)
      .single()
    const lastSent = cooldownRow?.last_sent_at
    if (lastSent) {
      const elapsed = (Date.now() - new Date(lastSent).getTime()) / 1000
      if (elapsed < COOLDOWN_SECONDS) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Resend cooldown',
            cooldown_seconds: Math.ceil(COOLDOWN_SECONDS - elapsed),
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const token = generateToken()
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString()

    await admin.from('email_verification_tokens').insert({
      user_id: user.id,
      token,
      expires_at: expiresAt,
    })

    await admin.from('resend_cooldowns').upsert(
      { user_id: user.id, last_sent_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

    const verifyLink = getVerifyLink(token)
    await sendVerificationEmail({ to: user.email, verifyLink })

    await admin.from('auth_audit_logs').insert({
      user_id: user.id,
      event: 'email_verification_sent',
      metadata: { source: 'send_verification' },
    })

    return new Response(
      JSON.stringify({ success: true, message: 'Verification email sent' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
