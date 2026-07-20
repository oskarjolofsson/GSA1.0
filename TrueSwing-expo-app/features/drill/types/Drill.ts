import type { Schemas } from 'lib/api/types';

// Derived from the backend OpenAPI schema (lib/api/schema.d.ts).
export type Drill = Schemas['GetDrill'];
export type CreateDrillRequest = Schemas['CreateDrillRequest'];
export type CreateDrillResponse = Schemas['CreateDrillResponse'];
export type UpdateDrillRequest = Schemas['UpdateDrillRequest'];
