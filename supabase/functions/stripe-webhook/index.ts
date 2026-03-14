/**
 * QuestHabit Stripe webhook: reconcile subscription and invoice events to local DB.
 * Verify Stripe-Signature with STRIPE_WEBHOOK_SECRET. Uses service role for DB writes.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const signature = req.headers.get('Stripe-Signature') ?? ''
  if (!webhookSecret || !signature) {
    return new Response(JSON.stringify({ error: 'Missing signature or secret' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const rawBody = await req.text()
  let event: { id: string; type: string; data: { object: Record<string, unknown> } }
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret) as typeof event
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl ?? '', supabaseServiceKey ?? '')

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as {
          customer?: string
          subscription?: string
          customer_email?: string
          metadata?: { supabase_user_id?: string }
        }
        const userId = session.metadata?.supabase_user_id
        const customerId = session.customer as string | undefined
        if (customerId && userId) {
          await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', userId)
        }
        if (session.subscription && userId) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          const priceId = sub.items?.data?.[0]?.price?.id
          const { data: plan } = await supabase.from('plans').select('id').eq('stripe_price_id', priceId).single()
          const planId = (plan as { id?: string } | null)?.id
          if (planId) {
            await supabase.from('subscriptions').upsert({
              user_id: userId,
              stripe_subscription_id: sub.id,
              plan_id: planId,
              status: sub.status,
              current_period_start: new Date((sub.current_period_start as number) * 1000).toISOString(),
              current_period_end: new Date((sub.current_period_end as number) * 1000).toISOString(),
              cancel_at_period_end: sub.cancel_at_period_end ?? false,
              cancel_at: sub.cancel_at ? new Date((sub.cancel_at as number) * 1000).toISOString() : null,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'stripe_subscription_id' })
          }
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as {
          id: string
          status: string
          customer: string
          current_period_start: number
          current_period_end: number
          cancel_at_period_end?: boolean
          cancel_at?: number
        }
        const { data: userRow } = await supabase.from('users').select('id').eq('stripe_customer_id', sub.customer).single()
        const userId = (userRow as { id?: string } | null)?.id
        if (!userId) break
        if (event.type === 'customer.subscription.deleted') {
          await supabase.from('subscriptions').delete().eq('stripe_subscription_id', sub.id)
        } else {
          const full = await stripe.subscriptions.retrieve(sub.id)
          const priceId = full.items?.data?.[0]?.price?.id ?? null
          let planId: string | null = null
          if (priceId) {
            const { data: planRow } = await supabase.from('plans').select('id').eq('stripe_price_id', priceId).single()
            planId = (planRow as { id?: string } | null)?.id ?? null
          }
          if (!planId) {
            const { data: existing } = await supabase.from('subscriptions').select('plan_id').eq('stripe_subscription_id', sub.id).single()
            planId = (existing as { plan_id?: string } | null)?.plan_id ?? null
          }
          if (planId) {
            await supabase.from('subscriptions').upsert({
              user_id: userId,
              stripe_subscription_id: sub.id,
              plan_id: planId,
              status: sub.status,
              current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
              cancel_at_period_end: sub.cancel_at_period_end ?? false,
              cancel_at: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'stripe_subscription_id' })
          }
        }
        break
      }
      case 'invoice.paid':
      case 'invoice.payment_failed':
      case 'invoice.finalized': {
        const inv = event.data.object as {
          id: string
          customer?: string
          amount_due?: number
          amount_paid?: number
          currency?: string
          status?: string
          period_start?: number
          period_end?: number
          invoice_pdf?: string | null
          billing_details?: Record<string, unknown>
        }
        const { data: userRow } = await supabase.from('users').select('id').eq('stripe_customer_id', inv.customer).single()
        const userId = (userRow as { id?: string } | null)?.id
        if (!userId) break
        await supabase.from('invoices').upsert({
          user_id: userId,
          stripe_invoice_id: inv.id,
          amount_due_cents: inv.amount_due ?? 0,
          amount_paid_cents: inv.amount_paid ?? 0,
          currency: inv.currency ?? 'usd',
          status: inv.status ?? 'draft',
          period_start: inv.period_start ? new Date(inv.period_start * 1000).toISOString() : null,
          period_end: inv.period_end ? new Date(inv.period_end * 1000).toISOString() : null,
          pdf_url: typeof inv.invoice_pdf === 'string' ? inv.invoice_pdf : null,
          billing_details_json: inv.billing_details ?? {},
        }, { onConflict: 'stripe_invoice_id' })
        break
      }
      case 'payment_method.attached': {
        const pm = event.data.object as { id: string; customer?: string; card?: { brand?: string; last4?: string; exp_month?: number; exp_year?: number } }
        const { data: userRow } = await supabase.from('users').select('id').eq('stripe_customer_id', pm.customer).single()
        const userId = (userRow as { id?: string } | null)?.id
        if (!userId || !pm.card) break
        const existing = await supabase.from('payment_methods').select('id').eq('user_id', userId).eq('stripe_payment_method_id', pm.id).maybeSingle()
        if (!existing.data) {
          const { count } = await supabase.from('payment_methods').select('*', { count: 'exact', head: true }).eq('user_id', userId)
          await supabase.from('payment_methods').insert({
            user_id: userId,
            stripe_payment_method_id: pm.id,
            brand: pm.card.brand ?? 'unknown',
            last4: pm.card.last4 ?? '',
            exp_month: pm.card.exp_month ?? 0,
            exp_year: pm.card.exp_year ?? 0,
            is_default: (count ?? 0) === 0,
          })
        }
        break
      }
      default:
        break
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
