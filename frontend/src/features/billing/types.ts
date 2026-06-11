export type SubscriptionSummary = {
  // Which system manages this subscription. 'stripe' is web-managed via the
  // customer portal; 'revenuecat' is a mobile (App Store / Play Store) purchase
  // that the web portal cannot touch and must be managed in the app.
  provider: 'stripe' | 'revenuecat';
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  ended_at: string | null;
};

export type BillingStatus = {
  is_subscribed: boolean;
  has_free_tier: boolean;
  can_access_premium: boolean;
  free_tier_expires_at: string;
  subscription: SubscriptionSummary | null;
};

export type PaywallReason = 'manual' | 'gate' | '402';
