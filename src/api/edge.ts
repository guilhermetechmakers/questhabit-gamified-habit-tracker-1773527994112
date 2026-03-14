import { supabase } from '@/lib/supabase'
import type { ProcessCompletionResult } from '@/api/gamification'
import type { AuthAuditEvent } from '@/types/auth'

export type { AuthAuditEvent }

export const edgeApi = {
  authAuditLog: async (
    event: AuthAuditEvent,
    metadata?: Record<string, unknown>
  ): Promise<void> => {
    const { error } = await supabase.functions.invoke('auth-audit-log', {
      body: { event, metadata: metadata ?? {} },
    })
    if (error) {
      // Non-blocking: log to console in dev, do not throw
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[auth-audit]', error.message)
      }
    }
  },
  processCompletion: async (
    habitId: string,
    source: 'app' | 'reminder' | 'offline_sync' = 'app',
    completionId?: string
  ): Promise<ProcessCompletionResult> => {
    const { data, error } = await supabase.functions.invoke('process-completion', {
      body: { habit_id: habitId, source, completion_id: completionId },
    })
    if (error) throw new Error(error.message)
    const result = data as ProcessCompletionResult
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error)
    return result
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
