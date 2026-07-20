/**
 * Single typed home for every backend API path. Service files under each
 * feature's `services` folder build their URLs from here instead of
 * hand-writing `/api/v1/...` string literals, so a route rename is a one-line
 * change and the full surface is greppable in one place.
 *
 * This is also the natural staging ground for deriving request/response types
 * from the backend's OpenAPI schema (a planned follow-up).
 */
const BASE = '/api/v1';

export const routes = {
  activity: {
    list: (tz: string) => `${BASE}/activity/?tz=${encodeURIComponent(tz)}`,
    byDate: (date: string, tz: string) => `${BASE}/activity/${date}/?tz=${encodeURIComponent(tz)}`,
  },

  analyses: {
    root: `${BASE}/analyses/`,
    byId: (analysisId: string) => `${BASE}/analyses/${analysisId}/`,
    byIssue: (issueId: string) => `${BASE}/analyses/by-issue/${issueId}/`,
    videoUrl: (analysisId: string, videoKey: string) =>
      `${BASE}/analyses/${analysisId}/video-url/?video_key=${encodeURIComponent(videoKey)}`,
    issues: (analysisId: string) => `${BASE}/analyses/${analysisId}/issues/`,
    issueOnAnalysis: (analysisId: string, analysisIssueId: string) =>
      `${BASE}/analyses/${analysisId}/issues/${analysisIssueId}/`,
    issueById: (analysisIssueId: string) => `${BASE}/analyses/issues/${analysisIssueId}/`,
  },

  billing: {
    status: `${BASE}/billing/status`,
  },

  drills: {
    root: `${BASE}/drills/`,
    all: `${BASE}/drills/all/`,
    bulk: `${BASE}/drills/bulk/`,
    byId: (drillId: string) => `${BASE}/drills/${drillId}/`,
    byIssue: (issueId: string) => `${BASE}/drills/by-issue/${issueId}/`,
  },

  issues: {
    root: `${BASE}/issues/`,
    all: `${BASE}/issues/all/`,
    bulk: `${BASE}/issues/bulk/`,
    todays: `${BASE}/issues/todays-issue/`,
    byId: (issueId: string) => `${BASE}/issues/${issueId}/`,
    byAnalysis: (analysisId: string) => `${BASE}/issues/by-analysis/${analysisId}/`,
    // Authoring / catalog paths (coach-feedback and browse).
    structureFeedback: `${BASE}/issues/structure-feedback/`,
    custom: `${BASE}/issues/custom/`,
    catalog: `${BASE}/issues/catalog/`,
  },

  programs: {
    generate: `${BASE}/programs/generate/`,
    active: (issueId: string) => `${BASE}/programs/active/?issue_id=${issueId}`,
    byIssue: (issueId: string) => `${BASE}/programs/by-issue/${issueId}/`,
    nextStep: (programId: string) => `${BASE}/programs/${programId}/next-step/`,
    stepComplete: (programId: string, stepId: string) =>
      `${BASE}/programs/${programId}/steps/${stepId}/complete/`,
  },

  practice: {
    sessionsStart: `${BASE}/practice/sessions/start/`,
    session: (sessionId: string) => `${BASE}/practice/sessions/${sessionId}/`,
    sessionComplete: (sessionId: string) => `${BASE}/practice/sessions/${sessionId}/complete/`,
    sessionResults: (sessionId: string) => `${BASE}/practice/sessions/${sessionId}/results/`,
    sessionDrillsStart: (sessionId: string) =>
      `${BASE}/practice/sessions/${sessionId}/drills/start/`,
    drillRunsComplete: `${BASE}/practice/drill-runs/complete/`,
  },

  users: {
    byId: (userId: string) => `${BASE}/users/${userId}/`,
  },
} as const;
