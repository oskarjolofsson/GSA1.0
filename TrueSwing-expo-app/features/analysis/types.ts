import type { Schemas } from 'lib/api/types';
import type { Issue } from 'features/issues/types';

// Response/request shapes derived from the backend OpenAPI schema
// (lib/api/schema.d.ts, regenerated via `npm run gen:api-types`). A backend
// field rename/removal surfaces as a TS error at the consumer.
export type Analysis = Schemas['GetAnalysis'];
export type AnalysisIssue = Schemas['GetAnalysisIssue'];
export type IssueSwingTimelineItem = Schemas['IssueSwingTimelineItem'];
export type CreateAnalysisRequest = Schemas['CreateAnalysisRequest'];
export type CreateAnalysisResponse = Schemas['CreateAnalysisResponse'];

// GET /analyses/{id}/video-url/ has no response_model on the backend (its
// OpenAPI schema is `{}`), so this stays hand-written until the backend adds one.
export interface VideoUrlResponse {
  success: boolean;
  video_url: string;
}

// View type: an analysis joined with its issues for component use.
export interface AnalysisWithIssues extends Analysis {
  issues?: (Issue & { confidence?: number })[];
  video_key?: string;
}
