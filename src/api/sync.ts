/**
 * Sync API: calls Edge Functions for batch sync and metadata.
 * Used by the sync engine when online.
 */

import { supabase } from '@/lib/supabase'
import type { SyncMetadata } from '@/types/offline'
import type { Habit } from '@/types/habit'

export interface SyncBatchRequest {
  habits?: Array<{ action: 'create' | 'update' | 'delete'; payload: unknown }>
  history?: Array<{ action: 'create'; payload: unknown }>
  reminders?: Array<{ action: 'create' | 'update' | 'delete'; payload: unknown }>
}

export interface SyncBatchResponse {
  habits?: Array<{ localId?: string; serverId: string; serverRow?: Habit; conflict?: boolean; error?: string }>
  history?: Array<{ localId?: string; serverId: string; error?: string }>
  reminders?: Array<{ localId?: string; serverId: string; error?: string }>
  conflicts?: Array<{ entityType: string; entityId: string; serverVersion: number; serverPayload?: unknown }>
}

export const syncApi = {
  async getMetadata(): Promise<SyncMetadata | null> {
    const { data, error } = await supabase.functions.invoke('sync-metadata')
    if (error) throw new Error(error.message)
    const payload = data as { serverVersion?: number; lastModified?: string; error?: string } | null
    if (payload?.error) throw new Error(payload.error)
    if (!payload?.serverVersion) return null
    return {
      serverVersion: payload.serverVersion,
      lastModified: payload.lastModified ?? new Date().toISOString(),
      lastSyncedAt: null,
    }
  },

  async pushBatch(body: SyncBatchRequest): Promise<SyncBatchResponse> {
    const { data, error } = await supabase.functions.invoke('sync', {
      body,
    })
    if (error) throw new Error(error.message)
    const payload = data as SyncBatchResponse & { error?: string }
    if (payload?.error) throw new Error((payload as { error: string }).error)
    return payload as SyncBatchResponse
  },
}
