/**
 * GET leaderboard: global or friends, by XP or streak. Paginated.
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

    let scope: 'global' | 'friends' = 'global'
    let metric: 'xp' | 'streak' | 'challenge_points' = 'xp'
    let page = 1
    let pageSize = 20
    if (req.method === 'POST') {
      try {
        const body = (await req.json()) as { scope?: string; metric?: string; page?: number; page_size?: number }
        scope = (body?.scope as 'global' | 'friends') || 'global'
        metric = (body?.metric as 'xp' | 'streak' | 'challenge_points') || 'xp'
        page = Math.max(1, body?.page ?? 1)
        pageSize = Math.min(50, Math.max(1, body?.page_size ?? 20))
      } catch { /* use defaults */ }
    } else {
      const url = new URL(req.url)
      scope = (url.searchParams.get('scope') as 'global' | 'friends') || 'global'
      metric = (url.searchParams.get('metric') as 'xp' | 'streak' | 'challenge_points') || 'xp'
      page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))
      pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get('page_size') ?? '20', 10)))
    }
    const offset = (page - 1) * pageSize

    let query = supabase
      .from('user_stats')
      .select('user_id, xp_total, level, current_streak, longest_streak', { count: 'exact' })

    if (scope === 'friends') {
      const { data: friendRows } = await supabase.from('users').select('id').eq('id', user.id).single()
      const friendIds: string[] = []
      // TODO: when friends table exists, filter by friend_ids; for now global
      if (friendIds.length > 0) {
        query = query.in('user_id', [user.id, ...friendIds])
      }
    }

    const orderBy = metric === 'streak' ? 'current_streak' : 'xp_total'
    const { data: statsRows, error: statsErr, count } = await query
      .order(orderBy, { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (statsErr) {
      return new Response(JSON.stringify({ error: statsErr.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const list = Array.isArray(statsRows) ? statsRows : []
    const total = count ?? list.length

    if (list.length === 0) {
      return new Response(
        JSON.stringify({ entries: [], total, page, page_size: pageSize }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userIds = list.map((r: { user_id: string }) => r.user_id)
    const { data: users } = await supabase.from('users').select('id, display_name, avatar_url').in('id', userIds)
    const userMap = new Map((users ?? []).map((u: { id: string; display_name: string | null; avatar_url: string | null }) => [u.id, u]))

    const entries = list.map((row: { user_id: string; xp_total: number; level: number; current_streak: number }, i: number) => {
      const u = userMap.get(row.user_id)
      return {
        user_id: row.user_id,
        display_name: u?.display_name ?? null,
        avatar_url: u?.avatar_url ?? null,
        rank: offset + i + 1,
        xp_total: row.xp_total ?? 0,
        level: row.level ?? 1,
        current_streak: row.current_streak ?? 0,
      }
    })

    return new Response(
      JSON.stringify({ entries, total, page, page_size: pageSize }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
