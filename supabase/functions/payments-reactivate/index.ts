/**
 * QuestHabit Payments: Reactivate a subscription set to cancel at period end.
 * Clears cancel_at_period_end in Stripe and local DB. Writes audit log.
 * Requires STRIPE_SECRET_KEY.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'

async function insertAuditLog(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  action: string,
  targetType: string | null,
  targetId: string | null,
  payload: Record<string, unknown>
) {
  await supabase.from('billing_audit_logs').insert({
    user_id: userId,
    actor_id: userId,
    action,
    target_type: targetType,
    target_id: targetId,
    payload: payload ?? {},
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const { data: sub } = await supabaseService
      .from('subscriptions')
      .select('id, stripe_subscription_id, cancel_at_period_end')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('current_period_end', { ascending: false })
      .limit(1)
      .maybeSingle()

    const row = sub as { stripe_subscription_id?: string; cancel_at_period_end?: boolean } | null
    const subId = row?.stripe_subscription_id
    if (!subId) {
      return new Response(JSON.stringify({ error: 'No active subscription found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!row?.cancel_at_period_end) {
      return new Response(JSON.stringify({ success: true, message: 'Subscription is already active' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await stripe.subscriptions.update(subId, { cancel_at_period_end: false })
    await supabaseService
      .from('subscriptions')
      .update({ cancel_at_period_end: false })
      .eq('stripe_subscription_id', subId)

    await insertAuditLog(supabaseService, user.id, 'subscription_reactivate', 'subscription', subId, {})

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
