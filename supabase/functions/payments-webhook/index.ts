/**
 * QuestHabit Payments: Stripe webhook endpoint.
 * Verifies STRIPE_WEBHOOK_SECRET, reconciles subscription and invoice events to DB.
 * No auth header; uses Stripe-Signature. Uses SUPABASE_SERVICE_ROLE_KEY for DB writes.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set')
}

function getRawBody(req: Request): Promise<string> {
  return req.text()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let event: { type: string; data: { object: Record<string, unknown> }; id?: string }
  try {
    const raw = await getRawBody(req)
    event = stripe.webhooks.constructEvent(raw, signature, webhookSecret) as typeof event
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const obj = event.data?.object ?? {}

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = obj as { customer?: string; subscription?: string; client_reference_id?: string }
        const customerId = session.customer as string | undefined
        const subscriptionId = session.subscription as string | undefined
        const userId = session.client_reference_id as string | undefined
        if (userId && customerId) {
          await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', userId)
        }
        if (subscriptionId && userId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          const item = sub.items?.data?.[0]
          const priceId = item?.price?.id ?? ''
          const { data: plan } = await supabase
            .from('plans')
            .select('id')
            .eq('stripe_price_id', priceId)
            .maybeSingle()
          const planId = (plan as { id?: string } | null)?.id ?? ''
          await supabase.from('subscriptions').upsert(
            {
              user_id: userId,
              stripe_subscription_id: sub.id,
              plan_id: planId || 'quest_monthly',
              status: sub.status ?? 'active',
              current_period_start: new Date((sub.current_period_start ?? 0) * 1000).toISOString(),
              current_period_end: new Date((sub.current_period_end ?? 0) * 1000).toISOString(),
              cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
              cancel_at_period_end: sub.cancel_at_period_end ?? false,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'stripe_subscription_id' }
          )
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = obj as {
          id: string
          customer?: string
          status?: string
          current_period_start?: number
          current_period_end?: number
          cancel_at?: number
          cancel_at_period_end?: boolean
          items?: { data?: { price?: { id?: string } }[] }
        }
        const priceId = sub.items?.data?.[0]?.price?.id ?? ''
        const { data: plan } = await supabase
          .from('plans')
          .select('id')
          .eq('stripe_price_id', priceId)
          .maybeSingle()
        const planId = (plan as { id?: string } | null)?.id ?? 'quest_monthly'
        const { data: userRow } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', sub.customer)
          .maybeSingle()
        const userId = (userRow as { id?: string } | null)?.id
        if (userId) {
          await supabase.from('subscriptions').upsert(
            {
              user_id: userId,
              stripe_subscription_id: sub.id,
              plan_id: planId,
              status: sub.status ?? 'active',
              current_period_start: new Date((sub.current_period_start ?? 0) * 1000).toISOString(),
              current_period_end: new Date((sub.current_period_end ?? 0) * 1000).toISOString(),
              cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
              cancel_at_period_end: sub.cancel_at_period_end ?? false,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'stripe_subscription_id' }
          )
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = obj as { id: string }
        await supabase.from('subscriptions').update({ status: 'canceled', updated_at: new Date().toISOString() }).eq('stripe_subscription_id', sub.id)
        break
      }

      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        const inv = obj as {
          id: string
          customer?: string
          amount_due?: number
          amount_paid?: number
          currency?: string
          status?: string
          period_start?: number
          period_end?: number
          invoice_pdf?: string
        }
        const { data: userRow } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', inv.customer)
          .maybeSingle()
        const userId = (userRow as { id?: string } | null)?.id
        if (userId) {
          await supabase.from('invoices').upsert(
            {
              user_id: userId,
              stripe_invoice_id: inv.id,
              amount_due: inv.amount_due ?? 0,
              amount_paid: inv.amount_paid ?? 0,
              currency: inv.currency ?? 'usd',
              status: inv.status ?? 'paid',
              period_start: inv.period_start ? new Date(inv.period_start * 1000).toISOString() : null,
              period_end: inv.period_end ? new Date(inv.period_end * 1000).toISOString() : null,
              pdf_url: inv.invoice_pdf ?? null,
            },
            { onConflict: 'stripe_invoice_id' }
          )
        }
        break
      }

      case 'invoice.payment_failed':
      case 'invoice.finalized': {
        const inv = obj as {
          id: string
          customer?: string
          amount_due?: number
          amount_paid?: number
          currency?: string
          status?: string
          period_start?: number
          period_end?: number
          invoice_pdf?: string
        }
        const { data: userRow } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', inv.customer)
          .maybeSingle()
        const userId = (userRow as { id?: string } | null)?.id
        if (userId) {
          await supabase.from('invoices').upsert(
            {
              user_id: userId,
              stripe_invoice_id: inv.id,
              amount_due: inv.amount_due ?? 0,
              amount_paid: inv.amount_paid ?? 0,
              currency: inv.currency ?? 'usd',
              status: inv.status ?? 'open',
              period_start: inv.period_start ? new Date(inv.period_start * 1000).toISOString() : null,
              period_end: inv.period_end ? new Date(inv.period_end * 1000).toISOString() : null,
              pdf_url: inv.invoice_pdf ?? null,
            },
            { onConflict: 'stripe_invoice_id' }
          )
        }
        break
      }

      case 'payment_method.attached': {
        const pm = obj as { id: string; customer?: string; card?: { brand?: string; last4?: string; exp_month?: number; exp_year?: number } }
        const { data: userRow } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', pm.customer)
          .maybeSingle()
        const userId = (userRow as { id?: string } | null)?.id
        if (userId && pm.card) {
          await supabase.from('payment_methods').upsert(
            {
              user_id: userId,
              stripe_payment_method_id: pm.id,
              brand: pm.card.brand ?? 'card',
              last4: pm.card.last4 ?? '',
              exp_month: pm.card.exp_month ?? 0,
              exp_year: pm.card.exp_year ?? 0,
              is_default: false,
            },
            { onConflict: 'stripe_payment_method_id' }
          )
        }
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('[payments-webhook]', event.type, err)
    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
