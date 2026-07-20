import type { Schemas } from 'lib/api/types';

// Derived from the backend OpenAPI schema. `started_at`/`completed_at` are ISO
// strings on the wire (the previous `Date` typing was a latent lie).
export type PracticeSession = Schemas['PracticeSessionResponse'];
