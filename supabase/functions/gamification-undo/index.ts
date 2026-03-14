/**
 * POST undo last completion: removes completion and recalculates user_stats.
 * Payload: { completion_id: string } to undo a specific completion.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const XP_PER_LEVEL = 100
const LEVEL_MULTIPLIER = 1.2

function xpForLevel(level: number): number {
  return Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1))
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

    const body = (await req.json()) as { completion_id: string }
    const completionId = body.completion_id
    if (!completionId) {
      return new Response(JSON.stringify({ error: 'completion_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: completion, error: fetchErr } = await supabase
      .from('completions')
      .select('id, user_id, habit_id, xp_awarded, timestamp')
      .eq('id', completionId)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !completion) {
      return new Response(JSON.stringify({ error: 'Completion not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const xpAwarded = (completion as { xp_awarded: number }).xp_awarded ?? 0

    const { error: deleteErr } = await supabase.from('completions').delete().eq('id', completionId).eq('user_id', user.id)
    if (deleteErr) {
      return new Response(JSON.stringify({ error: deleteErr.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: stats } = await supabase.from('user_stats').select('*').eq('user_id', user.id).single()
    const prevTotal = (stats?.xp_total ?? 0) - xpAwarded
    const newTotal = Math.max(0, prevTotal)

    let level = 1
    let xpForNext = xpForLevel(level)
    while (newTotal >= xpForNext && level < 100) {
      level += 1
      xpForNext = xpForLevel(level)
    }
    if (newTotal < xpForLevel(level)) level = Math.max(1, level - 1)

    const completionDate = (completion as { timestamp: string }).timestamp?.slice(0, 10)
    const lastCompletionDate = stats?.last_completion_date
    let newStreak = stats?.current_streak ?? 0
    if (lastCompletionDate === completionDate) {
      newStreak = Math.max(0, newStreak - 1)
    }
    const longestStreak = stats?.longest_streak ?? 0
    const rewardPointsDelta = Math.floor(xpAwarded * 0.1)
    const newRewardPoints = Math.max(0, ((stats as { rewards_points?: number })?.rewards_points ?? 0) - 1)

    let newLastDate = lastCompletionDate
    if (lastCompletionDate === completionDate) {
      const { data: remaining } = await supabase
        .from('completions')
        .select('timestamp')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()
      newLastDate = remaining ? (remaining as { timestamp: string }).timestamp?.slice(0, 10) ?? null : null
    }

    await supabase.from('user_stats').upsert(
      {
        user_id: user.id,
        xp_total: newTotal,
        level,
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_completion_date: newLastDate,
        rewards_points: newRewardPoints,
      },
      { onConflict: 'user_id' }
    )

    await supabase.from('events_log').insert({
      user_id: user.id,
      event_type: 'completion_undone',
      payload: { completion_id: completionId, xp_removed: xpAwarded },
    })

    return new Response(
      JSON.stringify({
        success: true,
        xp_total: newTotal,
        level,
        current_streak: newStreak,
        longest_streak: longestStreak,
        rewards_points: newRewardPoints,
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
