-- Make billing_subscriptions provider-agnostic (Stripe today, Apple IAP etc. later).
-- billing_customers already carries a `provider` column; bring subscriptions in line.

alter table billing_subscriptions rename column stripe_subscription_id to external_subscription_id;
alter table billing_subscriptions rename column stripe_price_id to external_price_id;
alter table billing_subscriptions rename column stripe_status to status;

alter table billing_subscriptions add column provider text not null default 'stripe';
alter table billing_subscriptions add column raw jsonb null;

-- The external id is only unique within a provider's id space, so replace the
-- global unique on the (formerly stripe) subscription id with a composite unique.
alter table billing_subscriptions
    drop constraint if exists billing_subscriptions_stripe_subscription_id_key;

alter table billing_subscriptions
    add constraint uq_billing_subscriptions_provider_external_id
    unique (provider, external_subscription_id);
