/**
 * Shared Stripe client for QuestHabit Edge Functions.
 * Uses STRIPE_SECRET_KEY from environment. Never expose to client.
 */
import Stripe from 'npm:stripe@14.21.0'

const secretKey = Deno.env.get('STRIPE_SECRET_KEY')
if (!secretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(secretKey, {
  apiVersion: '2024-11-20.acacia',
})

export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId)
}

export async function updateSubscriptionPrice(
  subscriptionId: string,
  subscriptionItemId: string,
  priceId: string,
  prorationBehavior: 'create_prorations' | 'none' = 'create_prorations'
): Promise<Stripe.Subscription> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  const itemId = sub.items?.data?.[0]?.id ?? subscriptionItemId
  return stripe.subscriptions.update(subscriptionId, {
    items: [{ id: itemId, price: priceId }],
    proration_behavior: prorationBehavior,
  })
}

export async function cancelSubscription(subscriptionId: string, immediately = false): Promise<Stripe.Subscription> {
  if (immediately) return stripe.subscriptions.cancel(subscriptionId)
  return stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })
}
