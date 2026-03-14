/**
 * QuestHabit gamification Edge Function.
 * Processes a habit completion: idempotent insert, updates user_stats (XP, level, streaks, rewards_points),
 * habit_streaks, awards badges when criteria are met, writes events_log.
 * Called by the client after marking a habit complete.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const DEFAULT_XP_PER_LEVEL = 100
const DEFAULT_LEVEL_MULTIPLIER = 1.2
const DEFAULT_POINTS_PER_COMPLETION = 1

function xpForLevel(levelNum: number, base: number, mult: number): number {
  return Math.floor(base * Math.pow(mult, levelNum - 1))
}

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

    const body = (await req.json()) as { habit_id: string; completion_id?: string; source?: string }
    const habitId = body.habit_id
    const idempotencyKey = body.completion_id ?? null
    const source = (body.source as 'app' | 'reminder' | 'offline_sync') ?? 'app'

    if (!habitId) {
      return new Response(
        JSON.stringify({ error: 'habit_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (idempotencyKey) {
      const { data: existing } = await supabase
        .from('completions')
        .select('id, timestamp, xp_awarded')
        .eq('user_id', user.id)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()
      if (existing) {
        const { data: stats } = await supabase.from('user_stats').select('*').eq('user_id', user.id).single()
        return new Response(
          JSON.stringify({
            completion: existing,
            xp_awarded: (existing as { xp_awarded?: number }).xp_awarded ?? 0,
            xp_total: stats?.xp_total ?? 0,
            level: stats?.level ?? 1,
            current_streak: stats?.current_streak ?? 0,
            longest_streak: stats?.longest_streak ?? 0,
            rewards_points: (stats as { rewards_points?: number })?.rewards_points ?? 0,
            already_processed: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
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
    const today = new Date().toISOString().slice(0, 10)

    const insertPayload: {
      habit_id: string
      user_id: string
      source: string
      xp_awarded: number
      idempotency_key?: string | null
    } = {
      habit_id: habitId,
      user_id: user.id,
      source,
      xp_awarded: xpAwarded,
    }
    if (idempotencyKey) insertPayload.idempotency_key = idempotencyKey

    const { data: completion, error: compErr } = await supabase
      .from('completions')
      .insert(insertPayload)
      .select()
      .single()

    if (compErr) {
      return new Response(
        JSON.stringify({ error: compErr.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: configRows } = await supabase.from('gamification_config').select('key, value')
    const config: Record<string, number> = {}
    for (const row of configRows ?? []) {
      const v = (row as { value: unknown }).value
      const key = (row as { key: string }).key
      if (typeof v === 'number') config[key] = v
      else if (typeof v === 'string') config[key] = parseFloat(v) || 0
    }
    const xpPerLevelBase = config.xp_per_level_base ?? DEFAULT_XP_PER_LEVEL
    const levelMult = config.level_multiplier ?? DEFAULT_LEVEL_MULTIPLIER
    const pointsPerCompletion = config.points_per_completion ?? DEFAULT_POINTS_PER_COMPLETION

    const { data: stats } = await supabase
      .from('user_stats')
      .select('xp_total, level, current_streak, longest_streak, last_completion_date, rewards_points')
      .eq('user_id', user.id)
      .single()

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
    const rewardsPoints = ((stats as { rewards_points?: number })?.rewards_points ?? 0) + pointsPerCompletion

    let level = stats?.level ?? 1
    let xpForNext = xpForLevel(level, xpPerLevelBase, levelMult)
    while (newTotal >= xpForNext) {
      level += 1
      xpForNext = xpForLevel(level, xpPerLevelBase, levelMult)
    }

    await supabase.from('user_stats').upsert(
      {
        user_id: user.id,
        xp_total: newTotal,
        level,
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_completion_date: today,
        rewards_points: rewardsPoints,
      },
      { onConflict: 'user_id' }
    )

    const { data: habitStreakRow } = await supabase
      .from('habit_streaks')
      .select('current_streak, longest_streak, last_active_date')
      .eq('user_id', user.id)
      .eq('habit_id', habitId)
      .maybeSingle()

    const lastHabitDate = habitStreakRow?.last_active_date
    let habitCurrent = habitStreakRow?.current_streak ?? 0
    let habitLongest = habitStreakRow?.longest_streak ?? 0
    if (lastHabitDate === yesterdayStr) {
      habitCurrent += 1
    } else if (lastHabitDate !== today) {
      habitCurrent = 1
    }
    habitLongest = Math.max(habitLongest, habitCurrent)

    await supabase.from('habit_streaks').upsert(
      {
        user_id: user.id,
        habit_id: habitId,
        current_streak: habitCurrent,
        longest_streak: habitLongest,
        last_active_date: today,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,habit_id' }
    )

    await supabase.from('events_log').insert({
      user_id: user.id,
      event_type: 'habit_completed',
      payload: {
        habit_id: habitId,
        completion_id: completion.id,
        xp_awarded: xpAwarded,
        xp_total: newTotal,
        level,
        streak: newStreak,
        source,
      },
    })

    const awardedBadgeIds: string[] = []
    const { data: badges } = await supabase.from('badges').select('id, criteria_json')
    for (const badge of badges ?? []) {
      const criteria = badge.criteria_json as Record<string, unknown> ?? {}
      const firstCompletion = criteria.first_completion === true
      const streak7 = (criteria.streak_days as number) === 7
      if (firstCompletion) {
        const { count } = await supabase
          .from('completions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
        if (count === 1) {
          // User's first ever completion (we just inserted it)
          await supabase.from('user_badges').upsert(
            { user_id: user.id, badge_id: badge.id },
            { onConflict: 'user_id,badge_id' }
          )
          awardedBadgeIds.push(badge.id)
        }
      }
      if (streak7 && habitCurrent >= 7) {
        const { data: ub } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', user.id)
          .eq('badge_id', badge.id)
          .maybeSingle()
        if (!ub) {
          await supabase.from('user_badges').insert({ user_id: user.id, badge_id: badge.id })
          awardedBadgeIds.push(badge.id)
        }
      }
    }

    return new Response(
      JSON.stringify({
        completion,
        xp_awarded: xpAwarded,
        xp_total: newTotal,
        level,
        current_streak: newStreak,
        longest_streak: longestStreak,
        rewards_points: rewardsPoints,
        habit_streak: habitCurrent,
        badges_awarded: awardedBadgeIds,
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
