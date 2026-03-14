import { supabase } from '@/lib/supabase'
import type { Habit, CreateHabitInput, UpdateHabitInput } from '@/types/habit'

export const habitsApi = {
  getAll: async (userId: string): Promise<Habit[]> => {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('archived', false)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []) as Habit[]
  },

  getById: async (id: string): Promise<Habit | null> => {
    const { data, error } = await supabase.from('habits').select('*').eq('id', id).single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }
    return data as Habit
  },

  create: async (input: CreateHabitInput): Promise<Habit> => {
    const { data, error } = await supabase.from('habits').insert(input).select().single()
    if (error) throw new Error(error.message)
    return data as Habit
  },

  update: async (id: string, updates: UpdateHabitInput): Promise<Habit> => {
    const { data, error } = await supabase
      .from('habits')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data as Habit
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('habits').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}
