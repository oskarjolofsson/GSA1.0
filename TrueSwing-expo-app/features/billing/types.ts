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
  provider: 'revenuecat' | 'manual'; // who manages the sub (store purchase, or an admin comp)
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

/**
 * What specifically triggered a '402' paywall open. Not part of `PaywallReason` on
 * purpose — the copy stays generic across both cases (CEO review: smaller diff, no new
 * enum branch in the modal). This is metadata only, for analytics segmentation (which
 * moment actually converts) and for retrying the original action after purchase.
 * - 'focus_limit' — tried to add a 2nd+ focus while unsubscribed
 * - 'ai_locked'   — tried to run AI analysis / structure-feedback while unsubscribed
 */
export type PaywallTrigger = 'focus_limit' | 'ai_locked';
