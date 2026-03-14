/**
 * QuestHabit asset upload: returns a signed upload URL for Supabase Storage.
 * Used for avatars, badges, and backup exports. Requires auth; paths are scoped by user_id.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const BUCKET = 'assets'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    )
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    )
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json() as { asset_type?: string; filename?: string; content_type?: string }
    const assetType = (body.asset_type ?? 'image') as string
    const filename = (body.filename ?? 'upload').replace(/[^a-zA-Z0-9._-]/g, '_')
    const contentType = body.content_type ?? 'application/octet-stream'

    const path = `${user.id}/${assetType}/${crypto.randomUUID()}_${filename}`

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const { data: signed, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path)

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        upload_url: signed?.signedUrl,
        path: signed?.path ?? path,
        token: signed?.token,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
