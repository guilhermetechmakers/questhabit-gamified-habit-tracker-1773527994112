export type CompletionSource = 'app' | 'reminder' | 'offline_sync'

export interface Completion {
  id: string
  habit_id: string
  user_id: string
  timestamp: string
  source: CompletionSource
  xp_awarded: number
  created_at: string
}

export interface CreateCompletionInput {
  habit_id: string
  user_id: string
  source?: CompletionSource
}
