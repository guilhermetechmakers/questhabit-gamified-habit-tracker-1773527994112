export interface ScheduleJson {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  interval?: number
  days?: number[]
  times?: string[]
  timezone?: string
}

export interface Reminder {
  id: string
  habit_id: string
  time_of_day: string
  offset_minutes?: number
  repeats?: string
  enabled: boolean
  next_due_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface CreateReminderInput {
  habit_id: string
  time_of_day: string
  offset_minutes?: number
  repeats?: string
  enabled?: boolean
}

export interface UpdateReminderInput {
  time_of_day?: string
  offset_minutes?: number
  repeats?: string
  enabled?: boolean
}

export interface Habit {
  id: string
  user_id: string
  title: string
  description?: string | null
  icon: string
  goal?: string | null
  schedule_json: ScheduleJson
  xp_value: number
  privacy_flag: 'private' | 'friends' | 'public'
  archived: boolean
  timezone?: string | null
  created_at: string
  updated_at: string
  reminders?: Reminder[]
}

export interface CreateReminderInput {
  habit_id: string
  time_of_day: string
  offset_minutes?: number
  repeats?: string
  enabled?: boolean
}

export interface UpdateReminderInput {
  time_of_day?: string
  offset_minutes?: number
  repeats?: string
  enabled?: boolean
}

export interface CreateHabitInput {
  user_id: string
  title: string
  description?: string
  icon?: string
  goal?: string
  schedule_json: ScheduleJson
  xp_value?: number
  privacy_flag?: 'private' | 'friends' | 'public'
  timezone?: string
}

export interface UpdateHabitInput {
  title?: string
  description?: string
  icon?: string
  goal?: string
  schedule_json?: ScheduleJson
  xp_value?: number
  privacy_flag?: 'private' | 'friends' | 'public'
  archived?: boolean
  timezone?: string
}

export interface HabitHistoryEntry {
  id: string
  habit_id: string
  date: string
  completed: boolean
  xp_gained: number
}

export interface HabitAnalytics {
  total_completions: number
  current_streak: number
  longest_streak: number
  completion_counts_by_day: Record<string, number>
  last_7_days: { date: string; completed: boolean; xp_gained: number }[]
}
