/**
 * QuestHabit offline sync: returns server sync metadata for the authenticated user.
 * GET: returns serverVersion (epoch) and lastModified (max updated_at from habits).
 * Used by the client to know when to pull updates.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: habits, error } = await supabase
      .from('habits')
      .select('updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)

    const lastModified =
      Array.isArray(habits) && habits.length > 0 && (habits[0] as { updated_at?: string })?.updated_at
        ? (habits[0] as { updated_at: string }).updated_at
        : new Date().toISOString()

    const serverVersion = Math.floor(new Date(lastModified).getTime() / 1000)

    return new Response(
      JSON.stringify({
        serverVersion,
        lastModified,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
