/**
 * QuestHabit Stripe: set default payment method for customer.
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

    const body = (await req.json()) as { payment_method_id: string }
    const pmId = body.payment_method_id
    if (!pmId) {
      return new Response(JSON.stringify({ error: 'payment_method_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile } = await supabase.from('users').select('stripe_customer_id').eq('id', user.id).single()
    const customerId = (profile as { stripe_customer_id?: string } | null)?.stripe_customer_id
    if (!customerId) {
      return new Response(JSON.stringify({ error: 'No Stripe customer' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: pmId } })
    await supabase.from('users').update({ default_payment_method_id: pmId }).eq('id', user.id)
    const { error: unsetErr } = await supabase.from('payment_methods').update({ is_default: false }).eq('user_id', user.id)
    if (!unsetErr) {
      await supabase.from('payment_methods').update({ is_default: true }).eq('user_id', user.id).eq('stripe_payment_method_id', pmId)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
