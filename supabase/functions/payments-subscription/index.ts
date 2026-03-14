/**
 * QuestHabit Payments: Create, update, or cancel subscription.
 * Uses Stripe Subscriptions API. Requires STRIPE_SECRET_KEY.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', '') ?? '')
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
    const { action, plan_id, proration = true } = body ?? {}

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const { data: profile } = await supabaseService
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()
    const customerId = (profile as { stripe_customer_id?: string } | null)?.stripe_customer_id
    if (!customerId) {
      return new Response(JSON.stringify({ error: 'No Stripe customer found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'cancel') {
      const { data: sub } = await supabaseService
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('current_period_end', { ascending: false })
        .limit(1)
        .maybeSingle()
      const subId = (sub as { stripe_subscription_id?: string } | null)?.stripe_subscription_id
      if (!subId) {
        return new Response(JSON.stringify({ error: 'No active subscription found' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      await stripe.subscriptions.update(subId, { cancel_at_period_end: true })
      return new Response(JSON.stringify({}), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'create') {
      if (!plan_id) {
        return new Response(JSON.stringify({ error: 'plan_id required for create' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const { data: plan } = await supabaseService
        .from('plans')
        .select('stripe_price_id')
        .eq('id', plan_id)
        .single()
      const priceId = (plan as { stripe_price_id?: string } | null)?.stripe_price_id
      if (!priceId) {
        return new Response(JSON.stringify({ error: 'Invalid plan_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: { user_id: user.id },
      })
      const invoice = subscription.latest_invoice
      const clientSecret =
        typeof invoice === 'object' && invoice && 'payment_intent' in invoice
          ? (invoice.payment_intent as { client_secret?: string })?.client_secret
          : undefined
      return new Response(
        JSON.stringify({
          subscription_id: subscription.id,
          client_secret: clientSecret ?? undefined,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'update') {
      if (!plan_id) {
        return new Response(JSON.stringify({ error: 'plan_id required for update' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const { data: sub } = await supabaseService
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('current_period_end', { ascending: false })
        .limit(1)
        .maybeSingle()
      const subId = (sub as { stripe_subscription_id?: string } | null)?.stripe_subscription_id
      if (!subId) {
        return new Response(JSON.stringify({ error: 'No active subscription found' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const stripeSub = await stripe.subscriptions.retrieve(subId)
      const itemId = stripeSub.items?.data?.[0]?.id
      if (!itemId) {
        return new Response(JSON.stringify({ error: 'Subscription has no items' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const { data: plan } = await supabaseService
        .from('plans')
        .select('stripe_price_id')
        .eq('id', plan_id)
        .single()
      const priceId = (plan as { stripe_price_id?: string } | null)?.stripe_price_id
      if (!priceId) {
        return new Response(JSON.stringify({ error: 'Invalid plan_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      await stripe.subscriptions.update(subId, {
        items: [{ id: itemId, price: priceId }],
        proration_behavior: proration ? 'create_prorations' : 'none',
      })
      return new Response(JSON.stringify({}), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
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
