/** Billing domain types for QuestHabit (Stripe-backed). */

export type PlanInterval = 'monthly' | 'yearly'

export interface Plan {
  id: string
  stripe_price_id: string
  name: string
  amount_cents: number
  currency: string
  interval: PlanInterval
  created_at?: string
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
  proration_invoice_id: string | null
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  user_id?: string
  stripe_invoice_id: string
  amount_due_cents: number
  amount_paid_cents: number
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
  amount_due_cents: number
  currency: string
  period_start: string | null
  period_end: string | null
}

export interface CheckoutSessionResult {
  sessionId: string
  url: string | null
  clientSecret: string | null
}
