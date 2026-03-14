/**
 * QuestHabit Reminders & Notifications — Push delivery webhook.
 * Receives callbacks from FCM/APNs (or internal) to record notification delivery status.
 * POST body: { user_id, type, title?, message?, status: 'delivered'|'failed', error?, related_habit_id? }
 * Writes to notifications_log for analytics and retry logic.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const VALID_STATUSES = ['delivered', 'failed', 'pending']

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = (await req.json()) as {
      user_id?: string
      type?: string
      title?: string
      message?: string
      status?: string
      error?: string
      related_habit_id?: string
    }

    const userId = body?.user_id
    const type = body?.type ?? 'push'
    const status = VALID_STATUSES.includes(body?.status ?? '') ? body.status : 'pending'

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'user_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await supabase.from('notifications_log').insert({
      user_id: userId,
      type,
      title: body.title ?? null,
      message: body.message ?? null,
      status,
      error: body.error ?? null,
      related_habit_id: body.related_habit_id ?? null,
    })

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
