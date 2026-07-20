import type { Schemas } from 'lib/api/types';

// Derived from the backend OpenAPI schema (lib/api/schema.d.ts). `GetIssue`
// already carries the view fields the app uses (confidence, progress,
// program_status, source), so Issue is a direct alias.
export type Issue = Schemas['GetIssue'];
export type CreateIssueRequest = Schemas['CreateIssueRequest'];
export type CreateIssueResponse = Schemas['CreateIssueResponse'];
export type UpdateIssueRequest = Schemas['UpdateIssueRequest'];
export type AnalysisIssueProgress = Schemas['IssueProgress'];
