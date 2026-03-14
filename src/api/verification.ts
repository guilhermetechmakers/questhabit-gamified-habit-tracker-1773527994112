import { supabase } from '@/lib/supabase'
import type {
  VerifyStatusResponse,
  VerifyStatusData,
  VerifyTokenResponse,
  ResendVerificationSuccess,
  ResendVerificationThrottled,
  UpdateEmailResponse,
} from '@/types/verification'

const DEFAULT_STATUS: VerifyStatusData = { verified: false, email: '' }

/**
 * Get current user's verification status. Use for polling.
 */
export async function getVerifyStatus(): Promise<VerifyStatusData> {
  const { data, error } = await supabase.functions.invoke<VerifyStatusResponse>('auth-verify-status', {
    body: {},
  })
  if (error) throw new Error(error.message)
  const payload = data as VerifyStatusResponse | undefined
  if (payload?.success && payload.data) {
    return {
      verified: !!payload.data.verified,
      email: typeof payload.data.email === 'string' ? payload.data.email : '',
    }
  }
  return DEFAULT_STATUS
}

/**
 * Resend verification email. Returns cooldown_seconds when throttled.
 */
export async function resendVerificationEmail(): Promise<{ cooldownSeconds: number }> {
  const { data, error } = await supabase.functions.invoke<
    ResendVerificationSuccess | ResendVerificationThrottled
  >('auth-resend-verification', { body: {} })
  if (error) throw new Error(error.message)
  const payload = data as ResendVerificationSuccess | ResendVerificationThrottled | undefined
  const cooldown = payload?.cooldown_seconds ?? 60
  if (!payload?.success) {
    throw new Error((payload as ResendVerificationThrottled)?.error ?? 'Failed to resend')
  }
  return { cooldownSeconds: cooldown }
}

/**
 * Verify email using token (from email link). Call when user lands on /verify?token=xxx.
 */
export async function verifyEmailToken(token: string): Promise<VerifyTokenResponse> {
  const { data, error } = await supabase.functions.invoke<VerifyTokenResponse>('auth-verify', {
    body: { token: token.trim() },
  })
  if (error) throw new Error(error.message)
  const payload: VerifyTokenResponse = (data as VerifyTokenResponse | undefined) ?? {
    success: false,
    error: 'No response',
  }
  return {
    success: !!payload.success,
    message: payload.message,
    error: payload.error,
  }
}

/**
 * Update email and send new verification email.
 */
export async function updateEmailAndResend(newEmail: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<UpdateEmailResponse>('auth-update-email', {
    body: { newEmail: newEmail.trim() },
  })
  if (error) throw new Error(error.message)
  const payload: UpdateEmailResponse = (data as UpdateEmailResponse | undefined) ?? {
    success: false,
    error: 'No response',
  }
  if (!payload.success) throw new Error(payload.error ?? 'Failed to update email')
}

/**
 * Request sending verification email (e.g. right after signup).
 */
export async function sendVerificationEmail(): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string }>(
    'auth-send-verification',
    { body: {} }
  )
  if (error) throw new Error(error.message)
  const payload = (data as { success?: boolean; error?: string } | undefined) ?? {}
  if (payload.success === false && payload.error) throw new Error(payload.error)
}
