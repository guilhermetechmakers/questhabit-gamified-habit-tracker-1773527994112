/** QuestHabit payment & subscription types (Stripe-backed). */

export interface Plan {
  id: string
  stripe_price_id: string
  name: string
  /** Price in cents (DB: amount_cents) */
  amount: number
  amount_cents?: number
  currency: string
  interval: 'monthly' | 'yearly'
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  plan_id: string
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at: string | null
  cancel_at_period_end: boolean
  proration_invoice_id?: string | null
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  stripe_invoice_id: string
  amount_due: number
  amount_paid: number
  currency: string
  status: string
  period_start: string | null
  period_end: string | null
  pdf_url: string | null
  billing_details?: Record<string, unknown>
  created_at: string
}

export interface PaymentMethod {
  id: string
  user_id: string
  stripe_payment_method_id: string
  brand: string
  last4: string
  exp_month: number
  exp_year: number
  is_default: boolean
  created_at?: string
}

export interface UpcomingInvoice {
  amount_due: number
  currency: string
  period_start: string | null
  period_end: string | null
}

export interface CheckoutSessionResult {
  session_id: string
  url?: string
}

export interface CheckoutSessionParams {
  type: 'subscription' | 'one_time'
  plan_id?: string
  price_id?: string
  success_url: string
  cancel_url: string
}

/** Proration preview when changing plan (Stripe upcoming invoice with new price). */
export interface ProrationPreview {
  amount_due: number
  currency: string
  period_start: string | null
  period_end: string | null
  /** Line items for proration breakdown */
  line_items?: Array<{ description?: string; amount: number }>
}

/** Billing audit log entry (plan change, cancel, reactivate, payment method). */
export interface BillingAuditLog {
  id: string
  user_id: string
  actor_id: string | null
  action: string
  target_type: string | null
  target_id: string | null
  payload: Record<string, unknown>
  created_at: string
}

/** Proration preview when changing plan (from Stripe upcoming invoice). */
export interface ProrationPreview {
  amount_due: number
  currency: string
  period_start: string | null
  period_end: string | null
  /** Line items for proration breakdown */
  line_items?: Array<{ amount: number; description?: string }>
}

export interface BillingAuditLog {
  id: string
  user_id: string
  actor_id: string | null
  action: string
  target_type: string | null
  target_id: string | null
  payload: Record<string, unknown>
  created_at: string
}
