import { supabase } from '@/lib/supabase'
import type { Reminder, CreateReminderInput, UpdateReminderInput } from '@/types/habit'

export const remindersApi = {
  getByHabit: async (habitId: string): Promise<Reminder[]> => {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('habit_id', habitId)
      .order('time_of_day', { ascending: true })
    if (error) throw new Error(error.message)
    return (data ?? []) as Reminder[]
  },

  getByHabitId: async (habitId: string): Promise<Reminder[]> => {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('habit_id', habitId)
      .order('time_of_day', { ascending: true })
    if (error) throw new Error(error.message)
    return (data ?? []) as Reminder[]
  },

  create: async (input: CreateReminderInput): Promise<Reminder> => {
    const { data, error } = await supabase
      .from('reminders')
      .insert({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as Reminder
  },

  update: async (id: string, habitId: string, updates: UpdateReminderInput): Promise<Reminder> => {
    const { data, error } = await supabase
      .from('reminders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('habit_id', habitId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as Reminder
  },

  delete: async (id: string, habitId: string): Promise<void> => {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id)
      .eq('habit_id', habitId)
    if (error) throw new Error(error.message)
  },
}
