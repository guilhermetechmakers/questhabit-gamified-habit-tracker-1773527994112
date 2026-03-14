/**
 * GET gamification config: XP rules, level thresholds, badge criteria.
 * Public read for authenticated users.
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
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: rows, error } = await supabase.from('gamification_config').select('key, value')
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const config: Record<string, unknown> = {}
    for (const row of rows ?? []) {
      const r = row as { key: string; value: unknown }
      config[r.key] = r.value
    }

    const xpPerLevelBase = typeof config.xp_per_level_base === 'number' ? config.xp_per_level_base : 100
    const levelMult = typeof config.level_multiplier === 'number' ? config.level_multiplier : 1.2
    const rewardPointsPerXp = typeof config.reward_points_per_xp === 'number' ? config.reward_points_per_xp : 0.1
    const levelThresholds = Array.isArray(config.level_thresholds) ? config.level_thresholds as number[] : []

    return new Response(
      JSON.stringify({
        xp_per_level_base: xpPerLevelBase,
        level_multiplier: levelMult,
        reward_points_per_xp: rewardPointsPerXp,
        level_thresholds: levelThresholds,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
