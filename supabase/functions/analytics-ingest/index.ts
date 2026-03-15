/**
 * Analytics Event Ingestion Edge Function.
 * Accepts events from web/mobile or external trackers (Amplitude/GA4).
 * Validates schema, tags source, and inserts into analytics_events.
 * Never expose API keys on client; call from server or with service key.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const EVENT_SCHEMA = {
  type: 'string',
  name: 'string',
  userId: 'optional_string',
  source: 'optional_string',
  properties: 'optional_object',
  piiFlag: 'optional_boolean',
} as const

function validateEvent(body: unknown): { valid: boolean; event?: Record<string, unknown>; error?: string } {
  if (!body || typeof body !== 'object') return { valid: false, error: 'Body must be an object' }
  const o = body as Record<string, unknown>
  if (typeof o.type !== 'string' || !o.type.trim()) return { valid: false, error: 'type is required' }
  if (typeof o.name !== 'string' || !o.name.trim()) return { valid: false, error: 'name is required' }
  const source = typeof o.source === 'string' && (o.source === 'web' || o.source === 'mobile') ? o.source : 'web'
  const userId = typeof o.userId === 'string' ? o.userId : null
  const properties = o.properties && typeof o.properties === 'object' ? o.properties : {}
  const piiFlag = Boolean(o.piiFlag)
  return {
    valid: true,
    event: {
      type: (o.type as string).trim(),
      name: (o.name as string).trim(),
      userId,
      source,
      properties,
      piiFlag,
    },
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json().catch(() => null)
    const { valid, event, error } = validateEvent(body)
    if (!valid || !event) {
      return new Response(JSON.stringify({ error: error ?? 'Validation failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const adminClient = createClient(supabaseUrl, serviceKey)

    const { error: insertError } = await adminClient.from('analytics_events').insert({
      user_id: event.userId ?? null,
      type: event.type,
      name: event.name,
      source: event.source ?? 'web',
      properties: event.properties ?? {},
      pii_flag: event.piiFlag ?? false,
    })

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
