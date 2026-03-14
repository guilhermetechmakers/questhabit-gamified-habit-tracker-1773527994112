import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsApi } from '@/api/payments'
import type { CheckoutSessionParams } from '@/types/payments'

export function usePlans() {
  return useQuery({
    queryKey: ['payments', 'plans'],
    queryFn: () => paymentsApi.getPlans(),
  })
}

export function useSubscription(userId: string | undefined) {
  return useQuery({
    queryKey: ['payments', 'subscription', userId],
    queryFn: () => (userId ? paymentsApi.getSubscription(userId) : Promise.resolve(null)),
    enabled: !!userId,
  })
}

export function useInvoices(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['payments', 'invoices', params?.limit, params?.offset],
    queryFn: () => paymentsApi.listInvoices(params),
  })
}

export function useInvoice(invoiceId: string | null) {
  return useQuery({
    queryKey: ['payments', 'invoice', invoiceId],
    queryFn: () => (invoiceId ? paymentsApi.getInvoice(invoiceId) : Promise.resolve(null)),
    enabled: !!invoiceId,
  })
}

export function usePaymentMethods(userId: string | undefined) {
  return useQuery({
    queryKey: ['payments', 'payment-methods', userId],
    queryFn: () => (userId ? paymentsApi.getPaymentMethods(userId) : Promise.resolve([])),
    enabled: !!userId,
  })
}

export function useUpcomingInvoice(userId: string | undefined) {
  return useQuery({
    queryKey: ['payments', 'upcoming-invoice', userId],
    queryFn: () => paymentsApi.getUpcomingInvoice(),
    enabled: !!userId,
  })
}

export function useCreateCheckoutSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: CheckoutSessionParams) => paymentsApi.createCheckoutSession(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    },
  })
}

export function useAttachPaymentMethod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (paymentMethodId: string) => paymentsApi.attachPaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    },
  })
}

export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (paymentMethodId: string) => paymentsApi.setDefaultPaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    },
  })
}

export function useSubscriptionAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { action: 'create' | 'update' | 'cancel'; plan_id?: string; proration?: boolean }) =>
      paymentsApi.subscriptionAction(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    },
  })
}

export function useInvoiceDownloadUrl() {
  return useMutation({
    mutationFn: (invoiceId: string) => paymentsApi.getInvoiceDownloadUrl(invoiceId),
  })
}

/** Load invoice PDF URL (for ReceiptDownloadButton). */
export async function loadInvoiceDownloadUrl(invoiceId: string): Promise<string | null> {
  try {
    const url = await paymentsApi.getInvoiceDownloadUrl(invoiceId)
    return url || null
  } catch {
    return null
  }
}
