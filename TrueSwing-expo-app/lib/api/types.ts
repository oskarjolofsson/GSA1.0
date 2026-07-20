import type { components } from './schema';

/**
 * Convenience handle on the backend's OpenAPI component schemas so feature type
 * files can write `Schemas['GetIssue']` instead of the full
 * `components['schemas']['GetIssue']` path. `schema.d.ts` is generated from the
 * live backend (`npm run gen:api-types`) — never hand-edit it. A backend field
 * rename/removal then surfaces as a TypeScript error wherever the aliased type
 * is consumed.
 */
export type Schemas = components['schemas'];
