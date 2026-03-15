/**
 * QuestHabit Payments: Detach payment method from Stripe customer.
 * Removes from Stripe and local payment_methods. Writes audit log.
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
    const { data: pmRow } = await supabaseService
      .from('payment_methods')
      .select('id, last4, brand')
      .eq('user_id', user.id)
      .eq('stripe_payment_method_id', paymentMethodId)
      .maybeSingle()
    if (!pmRow) {
      return new Response(JSON.stringify({ error: 'Payment method not found or not owned by user' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await stripe.paymentMethods.detach(paymentMethodId)
    await supabaseService
      .from('payment_methods')
      .delete()
      .eq('user_id', user.id)
      .eq('stripe_payment_method_id', paymentMethodId)

    await supabaseService.from('billing_audit_logs').insert({
      user_id: user.id,
      actor_id: user.id,
      action: 'payment_method_detach',
      target_type: 'payment_method',
      target_id: paymentMethodId,
      payload: { last4: (pmRow as { last4?: string }).last4, brand: (pmRow as { brand?: string }).brand },
    })

    return new Response(JSON.stringify({ success: true }), {
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
