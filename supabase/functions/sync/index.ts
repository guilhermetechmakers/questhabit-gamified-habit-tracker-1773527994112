/**
 * QuestHabit offline sync: accepts a batch of local changes and applies them server-side.
 * POST body: { habits?: [{ action: 'create'|'update'|'delete', payload }], history?: [...], reminders?: [...] }
 * Returns server ids and optional conflict flags. Uses JWT for auth.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface HabitPayload {
  id?: string
  user_id: string
  title: string
  description?: string | null
  icon?: string
  goal?: string | null
  schedule_json: Record<string, unknown>
  xp_value: number
  privacy_flag: string
  archived: boolean
  timezone?: string | null
  updated_at?: string
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
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = (await req.json()) as {
      habits?: Array<{ action: 'create' | 'update' | 'delete'; payload: HabitPayload & { id?: string } }>
      history?: Array<{ action: string; payload: unknown }>
      reminders?: Array<{ action: string; payload: unknown }>
    }

    const response: {
      habits?: Array<{
        localId?: string
        serverId: string
        serverRow?: Record<string, unknown>
        conflict?: boolean
        error?: string
        serverVersion?: number
      }>
      history?: Array<{ localId?: string; serverId: string; error?: string }>
      reminders?: Array<{ localId?: string; serverId: string; error?: string }>
      conflicts?: Array<{ entityType: string; entityId: string; serverVersion: number; serverPayload?: unknown }>
    } = {}

    const conflicts: (typeof response.conflicts) = []

    if (Array.isArray(body.habits)) {
      response.habits = []
      for (const item of body.habits) {
        const payload = item.payload as HabitPayload & { id?: string }
        if (!payload || payload.user_id !== user.id) {
          response.habits!.push({
            serverId: payload?.id ?? '',
            error: 'Forbidden or invalid payload',
          })
          continue
        }

        if (item.action === 'create') {
          const { id: _id, ...insertRow } = payload
          const { data: inserted, error } = await supabase
            .from('habits')
            .insert({ ...insertRow, user_id: user.id })
            .select()
            .single()
          if (error) {
            response.habits!.push({ serverId: '', error: error.message })
            continue
          }
          const row = inserted as { id: string; updated_at?: string }
          response.habits!.push({
            serverId: row.id,
            serverRow: inserted as Record<string, unknown>,
            serverVersion: row.updated_at ? Math.floor(new Date(row.updated_at).getTime() / 1000) : 0,
          })
        } else if (item.action === 'update' && payload.id) {
          const existing = await supabase
            .from('habits')
            .select('id, updated_at')
            .eq('id', payload.id)
            .eq('user_id', user.id)
            .single()
          if (existing.error || !existing.data) {
            response.habits!.push({ serverId: payload.id, error: existing.error?.message ?? 'Not found' })
            continue
          }
          const { id, user_id: _uid, ...updates } = payload
          const { data: updated, error } = await supabase
            .from('habits')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()
          if (error) {
            response.habits!.push({ serverId: id!, error: error.message })
            continue
          }
          const row = updated as { id: string; updated_at?: string }
          response.habits!.push({
            serverId: row.id,
            serverRow: updated as Record<string, unknown>,
            serverVersion: row.updated_at ? Math.floor(new Date(row.updated_at).getTime() / 1000) : 0,
          })
        } else if (item.action === 'delete' && payload.id) {
          const { error } = await supabase
            .from('habits')
            .delete()
            .eq('id', payload.id)
            .eq('user_id', user.id)
          if (error) {
            response.habits!.push({ serverId: payload.id, error: error.message })
            continue
          }
          response.habits!.push({ serverId: payload.id })
        }
      }
    }

    if (Array.isArray(body.history)) {
      response.history = []
      for (const item of body.history) {
        const pl = item.payload as { habit_id?: string; user_id?: string; timestamp?: string; xp_delta?: number; source?: string }
        if (!pl?.habit_id || pl.user_id !== user.id) {
          response.history!.push({ serverId: '', error: 'Invalid payload' })
          continue
        }
        const { data: habit } = await supabase
          .from('habits')
          .select('id, xp_value')
          .eq('id', pl.habit_id)
          .eq('user_id', user.id)
          .single()
        if (!habit) {
          response.history!.push({ serverId: '', error: 'Habit not found' })
          continue
        }
        const xpAwarded = pl.xp_delta ?? (habit as { xp_value?: number }).xp_value ?? 10
        const { data: completion, error } = await supabase
          .from('completions')
          .insert({
            habit_id: pl.habit_id,
            user_id: user.id,
            timestamp: pl.timestamp ?? new Date().toISOString(),
            source: pl.source ?? 'offline_sync',
            xp_awarded: xpAwarded,
          })
          .select('id')
          .single()
        if (error) {
          response.history!.push({ serverId: '', error: error.message })
          continue
        }
        response.history!.push({ serverId: (completion as { id: string }).id })
      }
    }

    if (Array.isArray(body.reminders)) {
      response.reminders = []
      for (const item of body.reminders) {
        const pl = item.payload as { habit_id?: string; time_of_day?: string; enabled?: boolean }
        if (!pl?.habit_id) {
          response.reminders!.push({ serverId: '', error: 'Invalid payload' })
          continue
        }
        const { data: habit } = await supabase
          .from('habits')
          .select('id')
          .eq('id', pl.habit_id)
          .eq('user_id', user.id)
          .single()
        if (!habit) {
          response.reminders!.push({ serverId: '', error: 'Habit not found' })
          continue
        }
        if (item.action === 'create') {
          const { data: reminder, error } = await supabase
            .from('reminders')
            .insert({
              habit_id: pl.habit_id,
              time_of_day: pl.time_of_day ?? '09:00',
              enabled: pl.enabled ?? true,
            })
            .select('id')
            .single()
          if (error) {
            response.reminders!.push({ serverId: '', error: error.message })
            continue
          }
          response.reminders!.push({ serverId: (reminder as { id: string }).id })
        } else {
          response.reminders!.push({ serverId: '', error: 'Unsupported action' })
        }
      }
    }

    if (conflicts.length > 0) response.conflicts = conflicts

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
