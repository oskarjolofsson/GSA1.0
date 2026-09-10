-- Stripe is gone (payments are store-only; see ADR-0045). A DEFAULT of 'stripe'
-- on the provider columns would silently label any future insert that forgets
-- provider with a provider that no longer exists. Every writer passes it
-- explicitly, so drop the default. Existing 'stripe' rows stay valid history.
ALTER TABLE public.billing_customers ALTER COLUMN provider DROP DEFAULT;
ALTER TABLE public.billing_subscriptions ALTER COLUMN provider DROP DEFAULT;
