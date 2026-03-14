/**
 * QuestHabit Stripe: get secure PDF download URL for an invoice.
 * Returns invoice_hosted_invoice_url or a signed URL from Stripe.
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

    const url = new URL(req.url)
    let invoiceId = url.searchParams.get('id')
    if (req.method === 'POST') {
      try {
        const body = (await req.json()) as { id?: string }
        if (body?.id) invoiceId = body.id
      } catch {
        // ignore
      }
    }
    if (!invoiceId) {
      return new Response(JSON.stringify({ error: 'id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: row } = await supabase
      .from('invoices')
      .select('stripe_invoice_id')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()
    const stripeInvoiceId = (row as { stripe_invoice_id?: string } | null)?.stripe_invoice_id
    if (!stripeInvoiceId) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const invoice = await stripe.invoices.retrieve(stripeInvoiceId)
    const pdfUrl = typeof invoice.invoice_pdf === 'string' ? invoice.invoice_pdf : invoice.invoice_pdf ?? null
    if (!pdfUrl) {
      return new Response(JSON.stringify({ error: 'PDF not available' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ url: pdfUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
