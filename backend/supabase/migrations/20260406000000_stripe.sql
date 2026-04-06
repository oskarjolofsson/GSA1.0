create table billing_customers (
    id uuid primary key default gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    provider text not null default 'stripe',
    customer_id text not null unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


create table billing_subscriptions (
    id uuid primary key default gen_random_uuid(),
    billing_customer_id uuid not null references billing_customers(id) on delete cascade,

    stripe_subscription_id text not null unique,
    stripe_price_id text not null,
    stripe_status text not null,

    current_period_start timestamptz null,
    current_period_end timestamptz null,
    cancel_at_period_end boolean not null default false,
    canceled_at timestamptz null,
    ended_at timestamptz null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);