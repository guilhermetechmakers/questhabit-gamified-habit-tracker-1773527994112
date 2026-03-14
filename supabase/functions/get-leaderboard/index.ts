/**
 * QuestHabit gamification: GET leaderboard (global or friends by XP/streak).
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

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
    const scope = (body.scope as string) ?? 'global'
    const metric = (body.metric as string) ?? 'xp'
    const page = Math.max(1, parseInt(String(body.page ?? 1), 10))
    const pageSize = Math.min(50, Math.max(1, parseInt(String(body.pageSize ?? 20), 10)))
    const offset = (page - 1) * pageSize

    let orderBy = 'xp_total'
    if (metric === 'streak') orderBy = 'current_streak'
    if (metric === 'challengePoints') orderBy = 'xp_total'

    let query = supabase
      .from('user_stats')
      .select('user_id, xp_total, level, current_streak, longest_streak', { count: 'exact' })
      .order(orderBy, { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (scope === 'friends') {
      return new Response(
        JSON.stringify({
          entries: [],
          total: 0,
          page,
          page_size: pageSize,
          message: 'Friends list not implemented; use scope=global',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: statsRows, error: statsErr, count } = await query

    if (statsErr) {
      return new Response(
        JSON.stringify({ error: statsErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userIds = (statsRows ?? []).map((r: { user_id: string }) => r.user_id)
    const { data: profiles } = userIds.length > 0
      ? await supabase.from('users').select('id, display_name, avatar_url').in('id', userIds)
      : { data: [] }
    const profileMap = new Map((profiles ?? []).map((p: { id: string; display_name: string | null; avatar_url: string | null }) => [p.id, p]))

    const entries = (statsRows ?? []).map((row: { user_id: string; xp_total: number; level: number; current_streak: number }, i: number) => {
      const p = profileMap.get(row.user_id)
      return {
        user_id: row.user_id,
        display_name: p?.display_name ?? null,
        avatar_url: p?.avatar_url ?? null,
        rank: offset + i + 1,
        xp_total: row.xp_total ?? 0,
        level: row.level ?? 1,
        current_streak: row.current_streak ?? 0,
      }
    })

    return new Response(
      JSON.stringify({
        entries,
        total: count ?? 0,
        page,
        page_size: pageSize,
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
