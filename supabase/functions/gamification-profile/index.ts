/**
 * GET gamification profile: XP, level, streaks, badges, reward_points for the authenticated user.
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

    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let targetUserId = user.id
    if (req.method === 'POST') {
      try {
        const body = (await req.json()) as { user_id?: string }
        if (body?.user_id) targetUserId = body.user_id
      } catch { /* ignore */ }
    } else {
      const url = new URL(req.url)
      targetUserId = url.searchParams.get('user_id') ?? user.id
    }
    if (targetUserId !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: stats, error: statsErr } = await supabase
      .from('user_stats')
      .select('xp_total, level, current_streak, longest_streak, last_completion_date, reward_points')
      .eq('user_id', targetUserId)
      .single()

    if (statsErr || !stats) {
      return new Response(
        JSON.stringify({
          user_id: targetUserId,
          total_xp: 0,
          level: 1,
          current_streak: 0,
          longest_streak: 0,
          reward_points: 0,
          badges: [],
          last_active: null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id, awarded_at')
      .eq('user_id', targetUserId)

    const badgeIds = (userBadges ?? []).map((ub: { badge_id: string }) => ub.badge_id)
    let badgesWithAwarded: { id: string; name: string; criteria_json: unknown; icon_url: string | null; rarity: string; awarded_at: string }[] = []

    if (badgeIds.length > 0) {
      const { data: badgeRows } = await supabase.from('badges').select('id, name, criteria_json, icon_url, rarity').in('id', badgeIds)
      const badgeMap = new Map((badgeRows ?? []).map((b: { id: string }) => [b.id, b]))
      badgesWithAwarded = (userBadges ?? []).map((ub: { badge_id: string; awarded_at: string }) => {
        const b = badgeMap.get(ub.badge_id)
        return b ? { ...b, awarded_at: ub.awarded_at } : null
      }).filter(Boolean) as typeof badgesWithAwarded
    }

    const profile = {
      user_id: targetUserId,
      total_xp: stats.xp_total ?? 0,
      level: stats.level ?? 1,
      current_streak: stats.current_streak ?? 0,
      longest_streak: stats.longest_streak ?? 0,
      reward_points: stats.reward_points ?? 0,
      badges: badgesWithAwarded,
      last_active: stats.last_completion_date ?? null,
    }

    return new Response(JSON.stringify(profile), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
