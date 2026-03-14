/**
 * QuestHabit gamification: POST redeem reward (spend points, grant reward).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    )
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = (await req.json()) as { reward_id: string }
    const rewardId = body.reward_id
    if (!rewardId) {
      return new Response(
        JSON.stringify({ error: 'reward_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: reward, error: rewardErr } = await supabase
      .from('rewards')
      .select('id, points_cost, badge_id')
      .eq('id', rewardId)
      .single()

    if (rewardErr || !reward) {
      return new Response(
        JSON.stringify({ error: 'Reward not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cost = (reward as { points_cost: number }).points_cost ?? 0
    const { data: stats, error: statsErr } = await supabase
      .from('user_stats')
      .select('rewards_points')
      .eq('user_id', user.id)
      .single()

    if (statsErr || !stats) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const balance = (stats as { rewards_points?: number }).rewards_points ?? 0
    if (balance < cost) {
      return new Response(
        JSON.stringify({ error: 'Insufficient points' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await supabase.from('user_rewards').insert({
      user_id: user.id,
      reward_id: rewardId,
    })

    await supabase.from('user_stats').update({
      rewards_points: balance - cost,
    }).eq('user_id', user.id)

    const badgeId = (reward as { badge_id?: string | null }).badge_id
    if (badgeId) {
      await supabase.from('user_badges').upsert(
        { user_id: user.id, badge_id: badgeId },
        { onConflict: 'user_id,badge_id' }
      )
    }

    await supabase.from('events_log').insert({
      user_id: user.id,
      event_type: 'reward_redeemed',
      payload: { reward_id: rewardId, points_spent: cost },
    })

    return new Response(
      JSON.stringify({
        success: true,
        rewards_points: balance - cost,
        reward_id: rewardId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
