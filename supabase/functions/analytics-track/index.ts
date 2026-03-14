/**
 * Analytics track: receives events from client and forwards to Amplitude (or logs).
 * Fire-and-forget; does not block. Requires AMPLITUDE_API_KEY secret for Amplitude.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )

    const { data: { user } } = await supabase.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', '') ?? '')
    const body = (await req.json()) as { event_type: string; properties?: Record<string, unknown> }
    const eventType = body.event_type ?? 'unknown'
    const props = body.properties ?? {}

    const payload = {
      user_id: user?.id ?? props.user_id,
      event_type: eventType,
      event_properties: { ...props, event_timestamp: new Date().toISOString() },
    }

    const amplitudeKey = Deno.env.get('AMPLITUDE_API_KEY')
    if (amplitudeKey) {
      await fetch('https://api2.amplitude.com/2/httpapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: amplitudeKey,
          events: [{
            user_id: payload.user_id,
            event_type: payload.event_type,
            event_properties: payload.event_properties,
            time: Date.now(),
          }],
        }),
      }).catch(() => {})
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ ok: false }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
