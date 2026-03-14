# QuestHabit Payments (Stripe) Setup

## Environment

Set these secrets for Edge Functions (e.g. `supabase secrets set` or project dashboard):

- **STRIPE_SECRET_KEY** – Stripe secret key (e.g. `sk_test_...` or `sk_live_...`)
- **STRIPE_WEBHOOK_SECRET** – Signing secret from Stripe Dashboard → Webhooks → Add endpoint → Signing secret
- **SUPABASE_SERVICE_ROLE_KEY** – Used by the webhook to write subscriptions/invoices (already set in Supabase)

## Webhook

1. In Stripe Dashboard → Webhooks, add endpoint: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
2. Subscribe to: `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`, `invoice.finalized`, `payment_method.attached`
3. Copy the signing secret into **STRIPE_WEBHOOK_SECRET**.

## Plans

After running migrations, insert or update plans with real Stripe Price IDs:

```sql
UPDATE public.plans SET stripe_price_id = 'price_xxx' WHERE name = 'Premium Monthly';
```

Or create prices in Stripe Dashboard and insert into `public.plans` with the correct `stripe_price_id`, `amount_cents`, `currency`, `interval`.

## Data model

- **users**: `stripe_customer_id`, `default_payment_method_id` (set by Edge Functions)
- **plans**: reference table; `stripe_price_id` must match Stripe
- **subscriptions**: one per active subscription; synced via webhook and subscription API
- **invoices**: synced via webhook; PDF URLs from Stripe
- **payment_methods**: card metadata only (no raw card data); attached via Edge Function after Elements/Checkout

## API (Edge Functions)

| Function | Purpose |
|----------|---------|
| `stripe-create-checkout-session` | Create Stripe Checkout Session (subscription or one-time); returns `url` for redirect |
| `stripe-attach-payment-method` | Attach payment method to customer (post-Elements) |
| `stripe-set-default-payment-method` | Set default payment method |
| `stripe-subscription` | create / update / cancel subscription |
| `stripe-invoices` | List or get single invoice (POST body: `id` or `limit`/`offset`) |
| `stripe-invoice-download` | Get PDF URL for an invoice |
| `stripe-upcoming-invoice` | Get upcoming invoice for customer |
| `stripe-webhook` | Stripe webhook handler (no auth; verifies signature) |

All except `stripe-webhook` require `Authorization: Bearer <user_jwt>`.
