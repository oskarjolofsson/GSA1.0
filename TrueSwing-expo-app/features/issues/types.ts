import type { Schemas } from 'lib/api/types';

// Derived from the backend OpenAPI schema (lib/api/schema.d.ts). `GetIssue`
export type Issue = Schemas['GetIssue'];
export type CreateIssueRequest = Schemas['CreateIssueRequest'];
export type CreateIssueResponse = Schemas['CreateIssueResponse'];
export type UpdateIssueRequest = Schemas['UpdateIssueRequest'];
