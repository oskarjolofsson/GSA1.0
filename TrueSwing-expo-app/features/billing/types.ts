/**
 * The app's entire notion of access comes from one backend call,
 * `GET /api/v1/billing/status`. Ported from the web frontend — same backend
 * contract across platforms.
 */
export type BillingStatus = {
  is_subscribed: boolean; // has an active paid subscription (any platform)
  has_free_tier: boolean; // still inside the free trial window
  can_access_premium: boolean; // THE authoritative gate flag
  free_tier_expires_at: string; // ISO timestamp (created_at + 7 days)
  subscription: SubscriptionSummary | null;
};

export type SubscriptionSummary = {
  provider: 'stripe' | 'revenuecat'; // who manages the sub
  status: string; // trialing | active | past_due | canceled | ...
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  ended_at: string | null;
};

/**
 * Why the paywall opened. Drives the modal headline.
 * - 'manual' — user chose to upgrade
 * - 'gate'   — they hit a premium entry point without access
 * - '402'    — a premium backend call returned Payment Required mid-session
 */
export type PaywallReason = 'manual' | 'gate' | '402';
