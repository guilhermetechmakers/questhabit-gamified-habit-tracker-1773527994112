/**
 * QuestHabit Stripe: create Checkout Session for subscription or one-time purchase.
 * Creates or retrieves Stripe customer, returns session URL for redirect.
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

    const { data: profile } = await supabase.from('users').select('stripe_customer_id').eq('id', user.id).single()
    let customerId = (profile as { stripe_customer_id?: string } | null)?.stripe_customer_id ?? null

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    if (type === 'subscription') {
      const priceId = price_id ?? (plan_id ? await getPriceIdFromPlanId(supabase, plan_id) : null)
      if (!priceId) {
        return new Response(JSON.stringify({ error: 'plan_id or price_id required for subscription' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: success_url,
        cancel_url: cancel_url,
        subscription_data: { metadata: { supabase_user_id: user.id } },
        allow_promotion_codes: true,
      })
      return new Response(
        JSON.stringify({ sessionId: session.id, url: session.url, clientSecret: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (type === 'one_time' && price_id) {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        line_items: [{ price: price_id, quantity: 1 }],
        success_url: success_url,
        cancel_url: cancel_url,
      })
      return new Response(
        JSON.stringify({ sessionId: session.id, url: session.url, clientSecret: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(JSON.stringify({ error: 'Invalid type or missing price_id for one_time' }), {
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

async function getPriceIdFromPlanId(supabase: ReturnType<typeof createClient>, planId: string): Promise<string | null> {
  const { data } = await supabase.from('plans').select('stripe_price_id').eq('id', planId).single()
  return (data as { stripe_price_id?: string } | null)?.stripe_price_id ?? null
}
