import { supabase } from '@/lib/supabase'

export const edgeApi = {
  processCompletion: async (habitId: string, source: 'app' | 'reminder' | 'offline_sync' = 'app') => {
    const { data, error } = await supabase.functions.invoke('process-completion', {
      body: { habit_id: habitId, source },
    })
    if (error) throw new Error(error.message)
    return data as {
      completion: unknown
      xp_awarded: number
      xp_total: number
      level: number
      current_streak: number
      longest_streak: number
    }
  },

  getUploadUrl: async (params: {
    asset_type: 'image' | 'badge' | 'export'
    filename: string
    content_type?: string
  }) => {
    const { data, error } = await supabase.functions.invoke('upload-url', {
      body: params,
    })
    if (error) throw new Error(error.message)
    const payload = data as { error?: string; upload_url?: string; path?: string; token?: string }
    if (payload?.error) throw new Error(payload.error)
    return { uploadUrl: payload.upload_url, path: payload.path, token: payload.token }
  },
}
