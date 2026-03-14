import { supabase } from '@/lib/supabase'

export type AssetType = 'image' | 'badge' | 'export'

export interface UploadUrlResponse {
  path: string
  signedUrl: string
  token?: string
  contentType: string
}

export const assetsApi = {
  getUploadUrl: async (
    assetType: AssetType,
    filename: string,
    contentType: string = 'image/*'
  ): Promise<UploadUrlResponse> => {
    const { data, error } = await supabase.functions.invoke<UploadUrlResponse>('upload-url', {
      body: { asset_type: assetType, filename, content_type: contentType },
    })
    if (error) throw new Error(error.message)
    if (!data?.signedUrl && !data?.path) throw new Error('Invalid upload URL response')
    return {
      path: data.path ?? '',
      signedUrl: data.signedUrl ?? data.path ?? '',
      token: data.token,
      contentType: data.contentType ?? contentType,
    }
  },
}
