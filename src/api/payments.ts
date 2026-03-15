import { supabase } from '@/lib/supabase'
import type {
  Invoice,
  Plan,
  Subscription,
  UpcomingInvoice,
  CheckoutSessionResult,
  PaymentMethod,
  ProrationPreview,
  BillingAuditLog,
} from '@/types/payments'

const guardInvoices = (data: unknown): Invoice[] =>
  Array.isArray(data) ? (data as Invoice[]) : []

const mapPlan = (row: Record<string, unknown>): Plan => ({
  id: String(row.id ?? ''),
  stripe_price_id: String(row.stripe_price_id ?? ''),
  name: String(row.name ?? ''),
  amount: Number(row.amount_cents ?? row.amount ?? 0),
  amount_cents: Number(row.amount_cents ?? row.amount ?? 0),
  currency: String(row.currency ?? 'usd'),
  interval: (row.interval === 'yearly' || row.interval === 'monthly' ? row.interval : 'monthly') as 'monthly' | 'yearly',
})

export const paymentsApi = {
  getPlans: async (): Promise<Plan[]> => {
    const { data, error } = await supabase.from('plans').select('*').order('amount_cents', { ascending: true })
    if (error) throw new Error(error.message)
    const rows = Array.isArray(data) ? data : []
    return rows.map((r) => mapPlan(r as Record<string, unknown>))
  },

  getSubscription: async (userId: string): Promise<Subscription | null> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return (data as Subscription | null) ?? null
  },

  getPaymentMethods: async (userId: string): Promise<PaymentMethod[]> => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []) as PaymentMethod[]
  },


  createCheckoutSession: async (params: {
    type: 'subscription' | 'one_time'
    plan_id?: string
    price_id?: string
    success_url: string
    cancel_url: string
  }): Promise<CheckoutSessionResult> => {
    const { data, error } = await supabase.functions.invoke('payments-checkout-session', {
      body: {
        type: params.type,
        plan_id: params.plan_id,
        price_id: params.price_id,
        success_url: params.success_url,
        cancel_url: params.cancel_url,
      },
    })
    if (error) throw new Error(error.message)
    const payload = data as { error?: string; session_id?: string; sessionId?: string; url?: string }
    if (payload?.error) throw new Error(payload.error)
    return {
      session_id: payload.session_id ?? payload.sessionId ?? '',
      url: payload.url ?? undefined,
    }
  },

  listInvoices: async (params?: {
    limit?: number
    offset?: number
    date_from?: string
    date_to?: string
    status?: string
  }): Promise<{ invoices: Invoice[]; count: number }> => {
    const limit = params?.limit ?? 20
    const offset = params?.offset ?? 0
    const { data, error } = await supabase.functions.invoke('payments-invoices', {
      body: {
        limit,
        offset,
        date_from: params?.date_from,
        date_to: params?.date_to,
        status: params?.status,
      },
    })
    if (error) throw new Error(error.message)
    const payload = data as { error?: string; invoices?: unknown[]; count?: number }
    if (payload?.error) throw new Error(payload.error)
    const invoices = guardInvoices(payload?.invoices ?? [])
    return { invoices, count: payload?.count ?? invoices.length }
  },

  getInvoice: async (id: string): Promise<Invoice | null> => {
    const { data, error } = await supabase.functions.invoke('payments-invoices', {
      body: { id },
    })
    if (error) throw new Error(error.message)
    const payload = data as { error?: string } & Partial<Invoice>
    if (payload?.error) throw new Error(payload.error)
    if (payload?.id) return payload as Invoice
    return null
  },

  getInvoiceDownloadUrl: async (invoiceId: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('payments-invoice-download', {
      body: { id: invoiceId },
    })
    if (error) throw new Error(error.message)
    const payload = data as { error?: string; url?: string }
    if (payload?.error) throw new Error(payload.error)
    return payload?.url ?? ''
  },

  getUpcomingInvoice: async (): Promise<UpcomingInvoice | null> => {
    const { data, error } = await supabase.functions.invoke('payments-upcoming-invoice', {
      body: {},
    })
    if (error) throw new Error(error.message)
    const payload = data as { error?: string; upcoming?: UpcomingInvoice | null } & Partial<UpcomingInvoice>
    if (payload?.error) throw new Error(payload.error)
    if (payload?.upcoming) return payload.upcoming
    if (typeof payload?.amount_due === 'number') return payload as UpcomingInvoice
    return null
  },

  subscriptionAction: async (params: {
    action: 'create' | 'update' | 'cancel' | 'reactivate'
    plan_id?: string
    proration?: boolean
  }): Promise<{ success: boolean; cancel_at_period_end?: boolean }> => {
    const { data, error } = await supabase.functions.invoke('payments-subscription', {
      body: {
        action: params.action,
        plan_id: params.plan_id,
        proration: params.proration ?? true,
      },
    })
    if (error) throw new Error(error.message)
    const payload = data as { error?: string; success?: boolean; cancel_at_period_end?: boolean }
    if (payload?.error) throw new Error(payload.error)
    return {
      success: payload?.success ?? false,
      cancel_at_period_end: payload?.cancel_at_period_end,
    }
  },

  attachPaymentMethod: async (paymentMethodId: string): Promise<void> => {
    const { data, error } = await supabase.functions.invoke('payments-attach-payment-method', {
      body: { payment_method_id: paymentMethodId },
    })
    if (error) throw new Error(error.message)
    const payload = data as { error?: string }
    if (payload?.error) throw new Error(payload.error)
  },

  setDefaultPaymentMethod: async (paymentMethodId: string): Promise<void> => {
    const { data, error } = await supabase.functions.invoke('payments-set-default-payment-method', {
      body: { payment_method_id: paymentMethodId },
    })
    if (error) throw new Error(error.message)
    const payload = data as { error?: string }
    if (payload?.error) throw new Error(payload.error)
  },

  detachPaymentMethod: async (paymentMethodId: string): Promise<void> => {
    const { data, error } = await supabase.functions.invoke('payments-detach-payment-method', {
      body: { payment_method_id: paymentMethodId },
    })
    if (error) throw new Error(error.message)
    const payload = data as { error?: string }
    if (payload?.error) throw new Error(payload.error)
  },

  getProrationPreview: async (planId?: string | null): Promise<ProrationPreview | null> => {
    const { data, error } = await supabase.functions.invoke('payments-proration-preview', {
      body: planId ? { plan_id: planId } : {},
    })
    if (error) throw new Error(error.message)
    const payload = data as { error?: string } & Partial<ProrationPreview>
    if (payload?.error) throw new Error(payload.error)
    if (typeof payload?.amount_due === 'number') {
      return {
        amount_due: payload.amount_due,
        currency: payload.currency ?? 'usd',
        period_start: payload.period_start ?? null,
        period_end: payload.period_end ?? null,
        line_items: Array.isArray(payload?.line_items) ? payload.line_items : undefined,
      }
    }
    return null
  },

  listBillingAuditLogs: async (params?: { limit?: number; offset?: number }): Promise<{ logs: BillingAuditLog[]; count: number }> => {
    const limit = params?.limit ?? 50
    const offset = params?.offset ?? 0
    const { data, error } = await supabase.functions.invoke('payments-audit-logs', {
      body: { limit, offset },
    })
    if (error) throw new Error(error.message)
    const payload = data as { error?: string; logs?: unknown[]; count?: number }
    if (payload?.error) throw new Error(payload.error)
    const logs = Array.isArray(payload?.logs) ? (payload.logs as BillingAuditLog[]) : []
    return { logs, count: payload?.count ?? logs.length }
  },
}

export type { Invoice, Plan, Subscription, UpcomingInvoice, CheckoutSessionResult, PaymentMethod, ProrationPreview, BillingAuditLog }
