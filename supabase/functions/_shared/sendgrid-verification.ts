/**
 * Send verification email via SendGrid. Used by auth-send-verification,
 * auth-resend-verification, and auth-update-email.
 * Requires: SENDGRID_API_KEY. Optional: SENDGRID_FROM_EMAIL, VERIFY_EMAIL_ORIGIN.
 */
const SENDGRID_URL = 'https://api.sendgrid.com/v3/mail/send'

export interface SendVerificationEmailParams {
  to: string
  verifyLink: string
}

export async function sendVerificationEmail(params: SendVerificationEmailParams): Promise<void> {
  const { to, verifyLink } = params
  const apiKey = Deno.env.get('SENDGRID_API_KEY')
  const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') ?? 'noreply@questhabit.app'
  if (!apiKey) throw new Error('Email service not configured')

  const subject = 'Verify your QuestHabit email'
  const text = `Verify your email by opening this link:\n\n${verifyLink}\n\nIf you didn't create an account, you can ignore this email.`
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Inter,Poppins,sans-serif;background:#FFF4EA;color:#0F1724;padding:24px;margin:0">
  <div style="max-width:480px;margin:0 auto;background:#FFF7F0;border-radius:16px;padding:32px;box-shadow:0 8px 20px rgba(15,17,36,0.06)">
    <h1 style="font-size:1.5rem;font-weight:600;margin:0 0 16px">Verify your email</h1>
    <p style="margin:0 0 24px;line-height:1.6">Click the button below to verify your QuestHabit account.</p>
    <a href="${verifyLink}" style="display:inline-block;background:linear-gradient(90deg,#FF9A57,#FFD7A8);color:#0F1724;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:12px;margin-bottom:24px">Verify email</a>
    <p style="font-size:0.875rem;color:#6B7280;margin:0">If you didn't create an account, you can ignore this email.</p>
  </div>
</body>
</html>`.trim()

  const payload = {
    personalizations: [{ to: [{ email: to.trim() }] }],
    from: { email: fromEmail, name: 'QuestHabit' },
    subject,
    content: [
      { type: 'text/plain', value: text },
      { type: 'text/html', value: html },
    ],
  }
  const maxRetries = 3
  let lastError: Error | null = null
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(SENDGRID_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errText = await res.text()
        lastError = new Error(`SendGrid error: ${res.status} ${errText}`)
        if (res.status >= 400 && res.status < 500 && res.status !== 429) break
        if (attempt < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000))
        }
        continue
      }
      return
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000))
      }
    }
  }
  throw lastError ?? new Error('SendGrid send failed')
}

/** Build verify link for the app. Origin from env or default. */
export function getVerifyLink(token: string): string {
  const origin = Deno.env.get('VERIFY_EMAIL_ORIGIN') ?? 'https://app.questhabit.com'
  return `${origin.replace(/\/$/, '')}/verify?token=${encodeURIComponent(token)}`
}
