# QuestHabit Payment Processing (Stripe)

## Overview

Billing is powered by Stripe. All payment and subscription operations run in Supabase Edge Functions so **API keys never touch the client**.

## Environment & Secrets

- **STRIPE_SECRET_KEY** – Stripe secret key (e.g. `sk_test_...` or `sk_live_...`). Set via `supabase secrets set STRIPE_SECRET_KEY <key>`.
- **STRIPE_WEBHOOK_SECRET** – Signing secret for the Stripe webhook (e.g. `whsec_...`). Set via `supabase secrets set STRIPE_WEBHOOK_SECRET <secret>`.

## Edge Functions

| Function | Purpose |
|----------|---------|
| `payments-checkout-session` | Create Stripe Checkout Session (subscription or one-time). Requires auth. |
| `payments-subscription` | Create/update/cancel subscription (plan change, cancel at period end). Requires auth. |
| `payments-attach-payment-method` | Attach a payment method to the user's Stripe customer. Requires auth. |
| `payments-set-default-payment-method` | Set default payment method. Requires auth. |
| `payments-webhook` | Stripe webhook handler. No auth; verifies `Stripe-Signature`. |
| `stripe-invoices` | List invoices or get one by id (body: `{ id? }` or `{ limit?, offset? }`). Requires auth. |
| `stripe-invoice-download` | Return hosted PDF URL for an invoice (body: `{ id }`). Requires auth. |
| `stripe-upcoming-invoice` | Return upcoming invoice for current subscription. Requires auth. |

## Database (migration `20250318120000_payments_stripe.sql`)

- **users** – `stripe_customer_id`, `default_payment_method_id` (and existing `subscription_id`).
- **plans** – Reference table: `id`, `stripe_price_id`, `name`, `amount` (cents), `currency`, `interval`.
- **subscriptions** – Per-user Stripe subscription state; RLS: users read own.
- **invoices** – Cached Stripe invoices for history and receipts; RLS: users read own.
- **payment_methods** – Cached card last4/brand/exp; RLS: users read own.

## Frontend

- **Routes:** `/app/billing` (overview), `/app/billing/checkout`, `/app/billing/subscription`, `/app/billing/history`.
- **Entry:** Profile → Billing.
- **API:** `src/api/payments.ts` (calls Edge Functions and Supabase for plans/subscription/payment methods).
- **Hooks:** `src/hooks/use-payments.ts` (React Query for plans, subscription, invoices, checkout, subscription actions).

## Webhook

1. In Stripe Dashboard → Developers → Webhooks, add endpoint: `https://<project>.supabase.co/functions/v1/payments-webhook`.
2. Subscribe to: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_succeeded`, `invoice.payment_failed`.
3. Copy the signing secret into Supabase: `supabase secrets set STRIPE_WEBHOOK_SECRET whsec_...`.

## Data flow

- **Checkout:** User picks plan → frontend calls `payments-checkout-session` → redirect to Stripe Checkout → on success, webhook + `checkout.session.completed` update `users.stripe_customer_id` and subscription is created; `customer.subscription.*` and `invoice.*` webhooks keep `subscriptions` and `invoices` in sync.
- **Invoices:** Webhooks upsert into `invoices`; list/detail/PDF use `stripe-invoices` and `stripe-invoice-download` with auth.
