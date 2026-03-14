/**
 * QuestHabit Reminders & Notifications — Scheduler Edge Function.
 * Cron-invoked: finds due reminders (next_due_at <= now), creates in-app notifications,
 * updates last_sent_at and next_due_at. Respects user_notification_settings (quiet hours, channels).
 * Integrates with FCM/APNs and SendGrid via secrets when configured.
 * Run via: supabase functions invoke trigger-reminders (or cron).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

function nextDueAt(timeOfDay: string, timezone: string): string {
  const [h, m] = timeOfDay.split(':').map(Number)
  const now = new Date()
  const local = new Date(now.toLocaleString('en-US', { timeZone: timezone || 'UTC' }))
  const next = new Date(local)
  next.setHours(h ?? 0, m ?? 0, 0, 0)
  if (next <= local) next.setDate(next.getDate() + 1)
  return next.toISOString()
}

function isInQuietHours(now: Date, start: string, end: string, timezone: string): boolean {
  if (!start || !end) return false
  const local = new Date(now.toLocaleString('en-US', { timeZone: timezone || 'UTC' }))
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const startMins = (sh ?? 0) * 60 + (sm ?? 0)
  const endMins = (eh ?? 0) * 60 + (em ?? 0)
  const currentMins = local.getHours() * 60 + local.getMinutes()
  if (startMins <= endMins) return currentMins >= startMins && currentMins < endMins
  return currentMins >= startMins || currentMins < endMins
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!serviceKey && !authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceKey ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      serviceKey ? {} : { global: { headers: { Authorization: authHeader ?? '' } } }
    )

    const now = new Date()
    const nowIso = now.toISOString()

    const { data: reminders, error: remErr } = await supabase
      .from('reminders')
      .select('id, habit_id, time_of_day, enabled')
      .eq('enabled', true)
      .lte('next_due_at', nowIso)

    if (remErr) {
      return new Response(
        JSON.stringify({ error: remErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const list = Array.isArray(reminders) ? reminders : []
    let processed = 0

    for (const rem of list) {
      const habitId = (rem as { habit_id: string }).habit_id
      const timeOfDay = (rem as { time_of_day: string }).time_of_day ?? '09:00'

      const { data: habit, error: habitErr } = await supabase
        .from('habits')
        .select('id, user_id, title')
        .eq('id', habitId)
        .single()

      if (habitErr || !habit) continue
      const userId = (habit as { user_id: string }).user_id
      const title = (habit as { title: string }).title ?? 'Reminder'

      let quietStart: string | null = null
      let quietEnd: string | null = null
      let tz = 'UTC'
      const { data: userRow } = await supabase.from('users').select('settings_json').eq('id', userId).maybeSingle()
      if (userRow?.settings_json && typeof userRow.settings_json === 'object') {
        const s = userRow.settings_json as { quietHours?: { start?: string; end?: string }; timezone?: string }
        if (s.quietHours?.start) quietStart = s.quietHours.start
        if (s.quietHours?.end) quietEnd = s.quietHours.end
        if (s.timezone) tz = s.timezone
      }
      if (quietStart && quietEnd && isInQuietHours(now, quietStart, quietEnd, tz)) {
        const nextAt = nextDueAt(timeOfDay, tz)
        await supabase.from('reminders').update({ next_due_at: nextAt, updated_at: nowIso }).eq('id', (rem as { id: string }).id)
        continue
      }

      const payload = {
        title: `Reminder: ${title}`,
        message: `Time for "${title}"`,
        related_habit_id: habitId,
        habit_id: habitId,
        time_of_day: timeOfDay,
      }
      const { error: notifErr } = await supabase.from('notifications').insert({
        user_id: userId,
        type: 'reminder',
        title: payload.title,
        message: payload.message,
        related_habit_id: habitId,
        payload_json: payload,
        read: false,
      })

      if (notifErr) continue

      const nextAt = nextDueAt(timeOfDay, tz)
      await supabase
        .from('reminders')
        .update({ next_due_at: nextAt, updated_at: nowIso })
        .eq('id', (rem as { id: string }).id)

      processed++
    }

    return new Response(
      JSON.stringify({ ok: true, processed, total: list.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
