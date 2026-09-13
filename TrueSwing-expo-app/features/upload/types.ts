import type { Analysis } from 'features/analysis/types';

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

// GET /analyses/{id}/ (get_analysis_status) actually has response_model=GetAnalysis
// on the backend -- it returns the analysis FLAT (status, analysis_id, ... all
// top-level), not wrapped in an {status, analysis} envelope. A prior version of
// this file assumed a wrapper that never existed, so every read of
// `status.analysis?.analysis_id` silently got `undefined`: analysisId was always
// null on the real upload path, which is why the review screen showed "Untitled
// focus" and no video (both hooks no-op cleanly on a null analysisId, so nothing
// even logged an error). Never carries issues either way -- GetAnalysis has no
// issues field -- fetch those separately via analysisService.getAnalysisIssues()
// once status is 'completed'.
export type AnalysisStatusResponse = Analysis;
