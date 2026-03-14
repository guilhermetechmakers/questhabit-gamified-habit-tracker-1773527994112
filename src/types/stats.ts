export interface UserStats {
  user_id: string
  xp_total: number
  level: number
  current_streak: number
  longest_streak: number
  last_completion_date: string | null
  rewards_points?: number
}
