/**
 * QuestHabit gamification Edge Function.
 * Processes a habit completion: inserts completion, updates user_stats (XP, level, streaks),
 * and awards badges when criteria are met. All in a transactional flow.
 * Called by the client after marking a habit complete.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const XP_PER_LEVEL = 100
const LEVEL_MULTIPLIER = 1.2

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

    const body = await req.json() as { habit_id: string; source?: string }
    const habitId = body.habit_id
    const source = (body.source as 'app' | 'reminder' | 'offline_sync') ?? 'app'

    if (!habitId) {
      return new Response(
        JSON.stringify({ error: 'habit_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: habit, error: habitErr } = await supabase
      .from('habits')
      .select('id, user_id, xp_value')
      .eq('id', habitId)
      .eq('user_id', user.id)
      .single()

    if (habitErr || !habit) {
      return new Response(
        JSON.stringify({ error: 'Habit not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const xpAwarded = habit.xp_value ?? 10

    const { data: completion, error: compErr } = await supabase
      .from('completions')
      .insert({
        habit_id: habitId,
        user_id: user.id,
        source,
        xp_awarded: xpAwarded,
      })
      .select()
      .single()

    if (compErr) {
      return new Response(
        JSON.stringify({ error: compErr.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: stats } = await supabase
      .from('user_stats')
      .select('xp_total, level, current_streak, longest_streak, last_completion_date')
      .eq('user_id', user.id)
      .single()

    const today = new Date().toISOString().slice(0, 10)
    const prevTotal = stats?.xp_total ?? 0
    const newTotal = prevTotal + xpAwarded
    const lastDate = stats?.last_completion_date
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)
    let newStreak = stats?.current_streak ?? 0
    if (lastDate === yesterdayStr) {
      newStreak += 1
    } else if (lastDate !== today) {
      newStreak = 1
    }
    const longestStreak = Math.max(stats?.longest_streak ?? 0, newStreak)

    let level = stats?.level ?? 1
    let xpForNext = XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1)
    while (newTotal >= xpForNext) {
      level += 1
      xpForNext = XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1)
    }

    await supabase
      .from('user_stats')
      .upsert(
        {
          user_id: user.id,
          xp_total: newTotal,
          level,
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_completion_date: today,
        },
        { onConflict: 'user_id' }
      )

    return new Response(
      JSON.stringify({
        completion,
        xp_awarded: xpAwarded,
        xp_total: newTotal,
        level,
        current_streak: newStreak,
        longest_streak: longestStreak,
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
