/**
 * QuestHabit Stripe: create, update (proration), or cancel subscription.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'

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

    const body = (await req.json()) as {
      action: 'create' | 'update' | 'cancel'
      plan_id?: string
      proration?: boolean
    }
    const { action, plan_id, proration = true } = body

    const { data: profile } = await supabase.from('users').select('stripe_customer_id').eq('id', user.id).single()
    const customerId = (profile as { stripe_customer_id?: string } | null)?.stripe_customer_id
    if (!customerId && action !== 'create') {
      return new Response(JSON.stringify({ error: 'No Stripe customer' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'cancel') {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('current_period_end', { ascending: false })
        .limit(1)
        .single()
      const subId = (sub as { stripe_subscription_id?: string } | null)?.stripe_subscription_id
      if (!subId) {
        return new Response(JSON.stringify({ error: 'No active subscription' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      await stripe.subscriptions.update(subId, { cancel_at_period_end: true })
      await supabase.from('subscriptions').update({ cancel_at_period_end: true }).eq('stripe_subscription_id', subId)
      return new Response(JSON.stringify({ success: true, cancel_at_period_end: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'update' && plan_id) {
      const { data: plan } = await supabase.from('plans').select('stripe_price_id').eq('id', plan_id).single()
      const priceId = (plan as { stripe_price_id?: string } | null)?.stripe_price_id
      if (!priceId) {
        return new Response(JSON.stringify({ error: 'Plan not found' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('current_period_end', { ascending: false })
        .limit(1)
        .single()
      const subId = (sub as { stripe_subscription_id?: string } | null)?.stripe_subscription_id
      if (!subId) {
        return new Response(JSON.stringify({ error: 'No active subscription' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const subscription = await stripe.subscriptions.retrieve(subId)
      const itemId = subscription.items?.data?.[0]?.id
      if (!itemId) {
        return new Response(JSON.stringify({ error: 'Subscription item not found' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      await stripe.subscriptions.update(subId, {
        items: [{ id: itemId, price: priceId }],
        proration_behavior: proration ? 'create_prorations' : 'none',
      })
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'create' && plan_id) {
      const { data: plan } = await supabase.from('plans').select('id, stripe_price_id').eq('id', plan_id).single()
      const stripePriceId = (plan as { stripe_price_id?: string } | null)?.stripe_price_id
      const planRowId = (plan as { id?: string } | null)?.id
      if (!stripePriceId || !planRowId) {
        return new Response(JSON.stringify({ error: 'Plan not found' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email ?? undefined,
          metadata: { supabase_user_id: user.id },
        })
        await supabase.from('users').update({ stripe_customer_id: customer.id }).eq('id', user.id)
        const sub = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: stripePriceId }],
          metadata: { supabase_user_id: user.id },
        })
        await upsertSubscription(supabase, user.id, planRowId, sub)
        return new Response(JSON.stringify({ success: true, subscription_id: sub.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const sub = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: stripePriceId }],
        metadata: { supabase_user_id: user.id },
      })
      await upsertSubscription(supabase, user.id, planRowId, sub)
      return new Response(JSON.stringify({ success: true, subscription_id: sub.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action or missing plan_id' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function upsertSubscription(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  planId: string,
  sub: { id: string; status: string; current_period_start: number; current_period_end: number; cancel_at_period_end: boolean; cancel_at?: number }
) {
  await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_subscription_id: sub.id,
      plan_id: planId,
      status: sub.status,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_subscription_id' }
  )
}
