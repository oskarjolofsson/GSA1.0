export type BillingStatus = {
  is_subscribed: boolean;
  has_free_tier: boolean;
  can_access_premium: boolean;
  free_tier_expires_at: string;
};

export type PaywallReason = 'manual' | 'gate' | '402';
