/**
 * Subscription types, derived from the backend's OpenAPI schema
 * (`app/api/v1/schemas/subscription.py`). Regenerate the schema with
 * `npm run gen:api-types`; these aliases then track any backend change
 * automatically (a renamed/removed field surfaces as a type error at the
 * consumer). See `lib/README.md`.
 */
import type { components } from "@/lib/api/schema";

/** An active subscriber row (`SubscriberResponse`). */
export type Subscriber = components["schemas"]["SubscriberResponse"];

/** One page of subscribers (`SubscriberPageResponse`). */
export type SubscriberPage = components["schemas"]["SubscriberPageResponse"];

/** A profile matched by admin search (`ProfileMatchResponse`). */
export type ProfileMatch = components["schemas"]["ProfileMatchResponse"];
