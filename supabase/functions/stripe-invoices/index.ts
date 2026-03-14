/**
 * QuestHabit Stripe: list invoices or get single invoice for the authenticated user.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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
    let id = url.searchParams.get('id')
    let limit = Math.min(Number(url.searchParams.get('limit')) || 20, 100)
    let offset = Number(url.searchParams.get('offset')) || 0
    if (req.method === 'POST') {
      try {
        const body = (await req.json()) as { id?: string; limit?: number; offset?: number }
        if (body?.id != null) id = body.id
        if (body?.limit != null) limit = Math.min(Number(body.limit) || 20, 100)
        if (body?.offset != null) offset = Number(body.offset) || 0
      } catch {
        // ignore body parse
      }
    }

    if (id) {
      const { data: row, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()
      if (error || !row) {
        return new Response(JSON.stringify({ error: 'Invoice not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const inv = row as Record<string, unknown>
      return new Response(
        JSON.stringify({
          id: inv.id,
          stripe_invoice_id: inv.stripe_invoice_id,
          amount_due_cents: inv.amount_due_cents ?? 0,
          amount_paid_cents: inv.amount_paid_cents ?? 0,
          currency: inv.currency ?? 'usd',
          status: inv.status,
          period_start: inv.period_start,
          period_end: inv.period_end,
          pdf_url: inv.pdf_url,
          billing_details_json: inv.billing_details_json ?? {},
          created_at: inv.created_at,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: rows, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    const list = Array.isArray(rows) ? rows : []
    const invoices = list.map((r: Record<string, unknown>) => ({
      id: r.id,
      stripe_invoice_id: r.stripe_invoice_id,
      amount_due_cents: r.amount_due_cents ?? 0,
      amount_paid_cents: r.amount_paid_cents ?? 0,
      currency: r.currency ?? 'usd',
      status: r.status,
      period_start: r.period_start,
      period_end: r.period_end,
      pdf_url: r.pdf_url,
      created_at: r.created_at,
    }))
    return new Response(JSON.stringify({ invoices, count: invoices.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
