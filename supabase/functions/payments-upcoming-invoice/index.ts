/**
 * QuestHabit Payments: Get upcoming invoice for current subscription.
 * Uses Stripe Invoices API. Requires STRIPE_SECRET_KEY.
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
      return new Response(JSON.stringify({ amount_due: 0, currency: 'usd', period_start: '', period_end: '' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const upcoming = await stripe.invoices.retrieveUpcoming({ customer: customerId })
    return new Response(
      JSON.stringify({
        amount_due: upcoming.amount_due ?? 0,
        currency: upcoming.currency ?? 'usd',
        period_start: upcoming.period_start
          ? new Date(upcoming.period_start * 1000).toISOString()
          : '',
        period_end: upcoming.period_end ? new Date(upcoming.period_end * 1000).toISOString() : '',
        next_payment_attempt: upcoming.next_payment_attempt
          ? new Date(upcoming.next_payment_attempt * 1000).toISOString()
          : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'invoice_upcoming_none') {
      return new Response(
        JSON.stringify({ amount_due: 0, currency: 'usd', period_start: '', period_end: '' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
