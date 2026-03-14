/**
 * QuestHabit Stripe: get upcoming invoice for the current subscription.
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

    const { data: profile } = await supabase.from('users').select('stripe_customer_id').eq('id', user.id).single()
    const customerId = (profile as { stripe_customer_id?: string } | null)?.stripe_customer_id
    if (!customerId) {
      return new Response(JSON.stringify({ upcoming: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const upcoming = await stripe.invoices.retrieveUpcoming({ customer: customerId }).catch(() => null)
    if (!upcoming) {
      return new Response(JSON.stringify({ upcoming: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const amountDue = upcoming.amount_due ?? 0
    const periodStart = upcoming.period_start ? new Date(upcoming.period_start * 1000).toISOString() : null
    const periodEnd = upcoming.period_end ? new Date(upcoming.period_end * 1000).toISOString() : null
    return new Response(
      JSON.stringify({
        upcoming: {
          amount_due: amountDue,
          currency: upcoming.currency ?? 'usd',
          period_start: periodStart,
          period_end: periodEnd,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
