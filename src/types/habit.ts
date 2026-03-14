export interface ScheduleJson {
  frequency: 'daily' | 'weekly' | 'custom'
  days?: number[]
  times?: string[]
  timezone?: string
}

export interface Habit {
  id: string
  user_id: string
  title: string
  icon: string
  schedule_json: ScheduleJson
  xp_value: number
  privacy_flag: 'private' | 'friends' | 'public'
  archived: boolean
  created_at: string
  updated_at: string
}

export interface CreateHabitInput {
  user_id: string
  title: string
  icon: string
  schedule_json: ScheduleJson
  xp_value?: number
  privacy_flag?: 'private' | 'friends' | 'public'
}

export interface UpdateHabitInput {
  title?: string
  icon?: string
  schedule_json?: ScheduleJson
  xp_value?: number
  privacy_flag?: 'private' | 'friends' | 'public'
  archived?: boolean
}
