import type { Analysis, AnalysisIssue } from 'features/analysis/types';

// CreateAnalysisResponse is derived from the backend schema and re-exported from the
// analysis feature.
export type { CreateAnalysisResponse } from 'features/analysis/types';

// Input-only shape assembled on the client before creating an analysis. Not a
// backend response, so it stays hand-written.
export interface Prompt {
  desired_shot: string;
  miss: string;
  extra: string;
  start_time: number;
  end_time: number;
}

// GET /analyses/{id}/ returns this via a route with no response_model, so it
// stays hand-written.
export interface AnalysisStatusResponse {
  status: string;
  error_message: string | null;
  // `issues` isn't on the generated `Analysis` schema (GetAnalysis) — this whole
  // response type is hand-written because the route has no response_model, so
  // it's extended here rather than in schema.d.ts.
  analysis: (Analysis & { issues?: AnalysisIssue[] }) | null;
}
