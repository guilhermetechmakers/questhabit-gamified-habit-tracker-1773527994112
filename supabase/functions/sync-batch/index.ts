/**
 * QuestHabit offline sync: batch push of local changes.
 * Accepts client sync queue operations (habits, history, reminders), applies with last-write-wins,
 * returns server state and any conflicts. Used by the web client for background sync.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = (await req.json()) as {
      operations?: Array<{
        localId: string
        action: string
        entityType: string
        payload: unknown
      }>
    }
    const operations = Array.isArray(body?.operations) ? body.operations : []
    const results: Array<{ localId: string; serverId?: string; error?: string }> = []
    const conflicts: Array<{
      localId: string
      entityType: string
      entityId: string
      localVersion: number
      serverVersion: number
      message?: string
    }> = []

    for (const op of operations) {
      const { localId, action, entityType, payload } = op ?? {}
      if (!localId || !action || !entityType) {
        results.push({ localId: localId ?? 'unknown', error: 'Missing localId, action, or entityType' })
        continue
      }

      try {
        if (entityType === 'habit') {
          const p = payload as Record<string, unknown>
          if (action === 'create' && p) {
            const { data: created, error } = await supabase
              .from('habits')
              .insert({
                user_id: user.id,
                title: p.title,
                description: p.description ?? null,
                icon: p.icon ?? 'target',
                goal: p.goal ?? null,
                schedule_json: p.schedule_json ?? { frequency: 'daily' },
                xp_value: typeof p.xp_value === 'number' ? p.xp_value : 10,
                privacy_flag: p.privacy_flag ?? 'private',
                timezone: p.timezone ?? null,
              })
              .select('id')
              .single()
            if (error) {
              results.push({ localId, error: error.message })
            } else {
              results.push({ localId, serverId: (created as { id: string })?.id })
            }
          } else if (action === 'update' && p?.id) {
            const { data: existing } = await supabase
              .from('habits')
              .select('updated_at')
              .eq('id', p.id)
              .eq('user_id', user.id)
              .single()
            if (!existing) {
              results.push({ localId, error: 'Habit not found' })
              continue
            }
            const { error: updateErr } = await supabase
              .from('habits')
              .update({
                title: p.title,
                description: p.description,
                icon: p.icon,
                goal: p.goal,
                schedule_json: p.schedule_json,
                xp_value: p.xp_value,
                privacy_flag: p.privacy_flag,
                archived: p.archived,
                timezone: p.timezone,
                updated_at: new Date().toISOString(),
              })
              .eq('id', p.id)
              .eq('user_id', user.id)
            if (updateErr) {
              results.push({ localId, error: updateErr.message })
            } else {
              results.push({ localId, serverId: String(p.id) })
            }
          } else if (action === 'delete' && p?.id) {
            const { error: delErr } = await supabase
              .from('habits')
              .delete()
              .eq('id', p.id)
              .eq('user_id', user.id)
            if (delErr) results.push({ localId, error: delErr.message })
            else results.push({ localId, serverId: String(p.id) })
          } else {
            results.push({ localId, error: 'Invalid habit action or payload' })
          }
        } else if (entityType === 'history') {
          const p = payload as { habit_id?: string; completion_id?: string; xp_awarded?: number }
          if (action === 'create' && p?.habit_id) {
            const { data: habit } = await supabase
              .from('habits')
              .select('xp_value')
              .eq('id', p.habit_id)
              .eq('user_id', user.id)
              .single()
            const xp = p.xp_awarded ?? (habit as { xp_value?: number } | null)?.xp_value ?? 10
            const { data: comp, error } = await supabase
              .from('completions')
              .insert({
                habit_id: p.habit_id,
                user_id: user.id,
                source: 'offline_sync',
                xp_awarded: xp,
                idempotency_key: p.completion_id ?? null,
              })
              .select('id')
              .single()
            if (error) results.push({ localId, error: error.message })
            else results.push({ localId, serverId: (comp as { id: string })?.id })
          } else {
            results.push({ localId, error: 'Invalid history action' })
          }
        } else if (entityType === 'reminder') {
          const p = payload as Record<string, unknown>
          if (action === 'create' && p?.habit_id) {
            const { data: rem, error } = await supabase
              .from('reminders')
              .insert({
                habit_id: p.habit_id,
                time_of_day: p.time_of_day ?? '09:00',
                offset_minutes: p.offset_minutes ?? 0,
                repeats: p.repeats ?? null,
                enabled: p.enabled !== false,
              })
              .select('id')
              .single()
            if (error) results.push({ localId, error: error.message })
            else results.push({ localId, serverId: (rem as { id: string })?.id })
          } else if (action === 'update' && p?.id) {
            const { error: uErr } = await supabase
              .from('reminders')
              .update({
                time_of_day: p.time_of_day,
                offset_minutes: p.offset_minutes,
                repeats: p.repeats,
                enabled: p.enabled,
                updated_at: new Date().toISOString(),
              })
              .eq('id', p.id)
            if (uErr) results.push({ localId, error: uErr.message })
            else results.push({ localId, serverId: String(p.id) })
          } else if (action === 'delete' && p?.id) {
            const { error: dErr } = await supabase.from('reminders').delete().eq('id', p.id)
            if (dErr) results.push({ localId, error: dErr.message })
            else results.push({ localId, serverId: String(p.id) })
          } else {
            results.push({ localId, error: 'Invalid reminder action' })
          }
        } else {
          results.push({ localId, error: `Unknown entityType: ${entityType}` })
        }
      } catch (e) {
        results.push({ localId, error: (e as Error).message })
      }
    }

    const { data: habits } = await supabase
      .from('habits')
      .select('id, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    const serverVersion = Date.now()
    const lastModified =
      Array.isArray(habits) && habits.length > 0
        ? (habits[0] as { updated_at?: string })?.updated_at ?? null
        : null

    return new Response(
      JSON.stringify({
        results,
        conflicts,
        serverVersion,
        lastModified,
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
