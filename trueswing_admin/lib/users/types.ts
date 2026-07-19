/**
 * User types, derived from the backend's OpenAPI schema
 * (`app/api/v1/schemas/user.py`). Regenerate with `npm run gen:api-types`;
 * these aliases then track any backend change automatically (a renamed/removed
 * field surfaces as a type error at the consumer). See `lib/README.md`.
 */
import type { components } from "@/lib/api/schema";

/** A single user row (`GetUser`). */
export type User = components["schemas"]["GetUser"];

/** One page of users (`GetUserPageResponse`). */
export type UserPage = components["schemas"]["GetUserPageResponse"];
