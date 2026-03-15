/**
 * QuestHabit Payments: Preview upcoming invoice with optional plan change (proration).
 * Uses Stripe retrieveUpcoming with subscription_items for plan change preview.
 * Requires STRIPE_SECRET_KEY.
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
      return new Response(
        JSON.stringify({
          amount_due: 0,
          currency: 'usd',
          period_start: null,
          period_end: null,
          line_items: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = (await req.json().catch(() => ({}))) as { plan_id?: string }
    const planId = body?.plan_id

    let upcoming: { amount_due?: number; currency?: string; period_start?: number; period_end?: number; lines?: { data?: Array<{ description?: string; amount?: number }> } }
    if (planId) {
      const { data: plan } = await supabaseService
        .from('plans')
        .select('stripe_price_id')
        .eq('id', planId)
        .single()
      const priceId = (plan as { stripe_price_id?: string } | null)?.stripe_price_id
      if (priceId) {
        const { data: sub } = await supabaseService
          .from('subscriptions')
          .select('stripe_subscription_id')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .order('current_period_end', { ascending: false })
          .limit(1)
          .maybeSingle()
        const subId = (sub as { stripe_subscription_id?: string } | null)?.stripe_subscription_id
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          const itemId = sub.items?.data?.[0]?.id
          if (itemId) {
            upcoming = await stripe.invoices.retrieveUpcoming({
              customer: customerId,
              subscription: subId,
              subscription_items: [{ id: itemId, price: priceId }],
            }) as typeof upcoming
          }
        }
      }
    }
    if (!upcoming) {
      upcoming = await stripe.invoices.retrieveUpcoming({ customer: customerId }) as typeof upcoming
    }

    const lineItems = Array.isArray(upcoming?.lines?.data)
      ? (upcoming.lines.data as Array<{ description?: string; amount?: number }>).map((line) => ({
          description: line.description ?? undefined,
          amount: line.amount ?? 0,
        }))
      : []

    return new Response(
      JSON.stringify({
        amount_due: upcoming?.amount_due ?? 0,
        currency: upcoming?.currency ?? 'usd',
        period_start: upcoming?.period_start ? new Date((upcoming.period_start as number) * 1000).toISOString() : null,
        period_end: upcoming?.period_end ? new Date((upcoming.period_end as number) * 1000).toISOString() : null,
        line_items: lineItems,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'invoice_upcoming_none') {
      return new Response(
        JSON.stringify({
          amount_due: 0,
          currency: 'usd',
          period_start: null,
          period_end: null,
          line_items: [],
        }),
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
