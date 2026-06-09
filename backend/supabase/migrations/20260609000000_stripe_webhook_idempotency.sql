-- Dedupe table: record every Stripe event id we've successfully processed.
create table processed_webhook_events (
    event_id text primary key,
    event_type text not null,
    processed_at timestamptz not null default now()
);

-- Ordering guard: remember the Stripe event timestamp that last wrote this row,
-- so out-of-order deliveries can't overwrite newer state with older state.
alter table billing_subscriptions
    add column last_event_at timestamptz null;
