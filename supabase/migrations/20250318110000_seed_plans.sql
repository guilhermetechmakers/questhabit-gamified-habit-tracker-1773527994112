-- Seed placeholder plans. Replace stripe_price_id with your Stripe Price IDs.
INSERT INTO public.plans (stripe_price_id, name, amount_cents, currency, interval)
VALUES
  ('price_monthly_placeholder', 'Premium Monthly', 999, 'usd', 'monthly'),
  ('price_yearly_placeholder', 'Premium Yearly', 9990, 'usd', 'yearly')
ON CONFLICT (stripe_price_id) DO NOTHING;
