/**
 * QuestHabit gamification: GET user profile (XP, level, streaks, badges, rewards_points).
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

    const userId = user.id

    const { data: stats, error: statsErr } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (statsErr || !stats) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id, awarded_at')
      .eq('user_id', userId)

    const badgeIds = (userBadges ?? []).map((ub: { badge_id: string }) => ub.badge_id)
    const { data: badges } = badgeIds.length > 0
      ? await supabase.from('badges').select('id, name, icon_url, rarity').in('id', badgeIds)
      : { data: [] }

    const badgeMap = new Map((badges ?? []).map((b: { id: string }) => [b.id, b]))
    const badgesWithMeta = (userBadges ?? []).map((ub: { badge_id: string; awarded_at: string }) => {
      const b = badgeMap.get(ub.badge_id)
      return {
        badge_id: ub.badge_id,
        name: b?.name ?? '',
        icon_url: b?.icon_url ?? null,
        rarity: b?.rarity ?? 'common',
        awarded_at: ub.awarded_at,
      }
    })

    const { data: habitStreaks } = await supabase
      .from('habit_streaks')
      .select('habit_id, current_streak, longest_streak')
      .eq('user_id', userId)

    const profile = {
      user_id: userId,
      total_xp: stats.xp_total ?? 0,
      level: stats.level ?? 1,
      current_streak: stats.current_streak ?? 0,
      longest_streak: stats.longest_streak ?? 0,
      rewards_points: stats.rewards_points ?? 0,
      badges: badgesWithMeta,
      habit_streaks: (habitStreaks ?? []).map((h: { habit_id: string; current_streak: number; longest_streak: number }) => ({
        habit_id: h.habit_id,
        current_streak: h.current_streak,
        longest_streak: h.longest_streak,
      })),
      last_active: stats.last_completion_date ?? null,
    }

    return new Response(JSON.stringify(profile), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
