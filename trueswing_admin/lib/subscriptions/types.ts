/**
 * Subscription types, derived from the backend's OpenAPI schema. Regenerate with
 * `npm run gen:api-types`. See `lib/README.md`.
 */
import type { components } from "@/lib/api/schema";

/** An active subscriber row (`SubscriberResponse`). */
export type Subscriber = components["schemas"]["SubscriberResponse"];

/** One page of subscribers (`SubscriberPageResponse`). */
export type SubscriberPage = components["schemas"]["SubscriberPageResponse"];

/** A profile matched by admin search (`ProfileMatchResponse`). */
export type ProfileMatch = components["schemas"]["ProfileMatchResponse"];
