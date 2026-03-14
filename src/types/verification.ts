/** Response from auth-verify-status Edge Function */
export interface VerifyStatusData {
  verified: boolean
  email: string
}

export interface VerifyStatusResponse {
  success: boolean
  data?: VerifyStatusData
  error?: string
}

/** Response from auth-resend-verification (success) */
export interface ResendVerificationSuccess {
  success: true
  cooldown_seconds?: number
}

/** Response from auth-resend-verification (throttled) */
export interface ResendVerificationThrottled {
  success: false
  error: string
  cooldown_seconds?: number
}

/** Response from auth-verify (token verification) */
export interface VerifyTokenResponse {
  success: boolean
  message?: string
  error?: string
}

/** Response from auth-update-email */
export interface UpdateEmailResponse {
  success: boolean
  message?: string
  error?: string
}
