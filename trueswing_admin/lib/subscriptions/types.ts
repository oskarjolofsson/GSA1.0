/**
 * Subscription types as returned by the TrueSwing admin API
 * (`app/api/v1/schemas/subscription.py`).
 */

/** An active subscriber row (`SubscriberResponse`). */
export interface Subscriber {
  user_id: string;
  name: string;
  email: string;

  subscription_id: string;
  provider: string;
  status: string;
  /** null for manual comp grants, which never auto-expire. */
  current_period_end: string | null;
}

/** One page of subscribers (`SubscriberPageResponse`). */
export interface SubscriberPage {
  items: Subscriber[];
  total: number;
  limit: number;
  offset: number;
}

/** A profile matched by admin search (`ProfileMatchResponse`). */
export interface ProfileMatch {
  user_id: string;
  name: string;
  email: string;

  subscribed: boolean;
  provider: string | null;
  subscription_id: string | null;
}
