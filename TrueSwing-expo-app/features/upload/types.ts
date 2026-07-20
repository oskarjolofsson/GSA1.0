import type { Analysis } from 'features/analysis/types';

// CreateAnalysisResponse is derived from the backend schema and re-exported from
// the analysis feature; the old duplicate declaration here has been removed.
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
  analysis: Analysis | null;
}
