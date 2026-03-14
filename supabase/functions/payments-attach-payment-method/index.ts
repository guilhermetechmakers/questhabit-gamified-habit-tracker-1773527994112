/**
 * QuestHabit Payments: Attach payment method to Stripe customer.
 * Requires STRIPE_SECRET_KEY. Called by client with auth.
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

    const body = (await req.json()) as { payment_method_id: string }
    const paymentMethodId = body?.payment_method_id
    if (!paymentMethodId) {
      return new Response(JSON.stringify({ error: 'payment_method_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

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

    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })

    const pm = await stripe.paymentMethods.retrieve(paymentMethodId)
    const card = pm.card
    if (card) {
      const existing = await supabaseService
        .from('payment_methods')
        .select('id')
        .eq('user_id', user.id)
        .eq('stripe_payment_method_id', paymentMethodId)
        .maybeSingle()
      if (!existing?.data) {
        await supabaseService.from('payment_methods').insert({
          user_id: user.id,
          stripe_payment_method_id: paymentMethodId,
          brand: card.brand ?? 'card',
          last4: card.last4 ?? '',
          exp_month: card.exp_month ?? 0,
          exp_year: card.exp_year ?? 0,
          is_default: false,
        })
      }
    }

    return new Response(JSON.stringify({}), {
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
