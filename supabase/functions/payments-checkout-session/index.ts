/**
 * QuestHabit Payments: Create Stripe Checkout Session (subscription or one-time).
 * API: Stripe Checkout Sessions Create. Requires STRIPE_SECRET_KEY.
 * Called by client with auth; creates or uses Stripe customer, returns session URL.
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
      type: 'subscription' | 'one_time'
      plan_id?: string
      price_id?: string
      success_url: string
      cancel_url: string
    }
    const { type, plan_id, price_id, success_url, cancel_url } = body
    if (!success_url || !cancel_url) {
      return new Response(JSON.stringify({ error: 'success_url and cancel_url required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let { data: profile } = await supabaseService
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = (profile as { stripe_customer_id?: string } | null)?.stripe_customer_id ?? null

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabaseService
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const sessionParams: {
      customer: string
      mode: 'subscription' | 'payment'
      line_items: { price: string; quantity: number }[]
      success_url: string
      cancel_url: string
      client_reference_id?: string
      metadata?: Record<string, string>
      subscription_data?: { metadata?: Record<string, string> }
    } = {
      customer: customerId,
      mode: type === 'subscription' ? 'subscription' : 'payment',
      line_items: [],
      success_url,
      cancel_url,
      client_reference_id: user.id,
      metadata: { user_id: user.id },
    }
    if (type === 'subscription') {
      sessionParams.subscription_data = { metadata: { user_id: user.id } }
    }

    if (type === 'subscription') {
      let priceId = price_id ?? null
      if (!priceId && plan_id) {
        const { data: plan } = await supabaseService.from('plans').select('stripe_price_id').eq('id', plan_id).single()
        priceId = (plan as { stripe_price_id?: string } | null)?.stripe_price_id ?? null
      }
      if (!priceId) {
        return new Response(JSON.stringify({ error: 'plan_id or price_id required for subscription' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      sessionParams.line_items = [{ price: priceId, quantity: 1 }]
    } else {
      if (!price_id) {
        return new Response(JSON.stringify({ error: 'price_id required for one_time' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      sessionParams.line_items = [{ price: price_id, quantity: 1 }]
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return new Response(
      JSON.stringify({
        session_id: session.id,
        url: session.url ?? undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
