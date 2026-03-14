/**
 * QuestHabit — Update user email and send new verification email.
 * POST { newEmail }, requires Authorization. Invalidates existing tokens, sends new one via SendGrid.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { sendVerificationEmail, getVerifyLink } from '../_shared/sendgrid-verification.ts'

const TOKEN_TTL_MINUTES = 30
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader ?? '' } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = (await req.json()) as { newEmail?: string }
    const newEmail = typeof body.newEmail === 'string' ? body.newEmail.trim().toLowerCase() : ''
    if (!newEmail || !EMAIL_REGEX.test(newEmail)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Valid email address required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await admin.auth.admin.updateUserById(user.id, { email: newEmail })
    await admin.from('users').update({ email: newEmail, email_verified: false }).eq('id', user.id)

    await admin.from('email_verification_tokens').delete().eq('user_id', user.id)

    const token = generateToken()
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString()
    await admin.from('email_verification_tokens').insert({
      user_id: user.id,
      token,
      expires_at: expiresAt,
    })

    await sendVerificationEmail({ to: newEmail, verifyLink: getVerifyLink(token) })

    await admin.from('auth_audit_logs').insert({
      user_id: user.id,
      event: 'email_verification_sent',
      metadata: { source: 'update_email', new_email: newEmail },
    })

    return new Response(
      JSON.stringify({ success: true, message: 'Email updated; verification sent' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
