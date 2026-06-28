# Analyses — How To Use

The analyses group is the core feature: a user uploads a golf swing video and the
backend runs an AI analysis that detects swing **issues**. This guide covers
creating an analysis, uploading the video, running the analysis, and reading or
deleting results.

All routes are under `/api/v1/analyses` and require a bearer token. See
[README](./README.md) for the auth model and access-level marks.

---

## 1. Endpoints

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| POST | `/api/v1/analyses/` | ⭐ Premium | Create an analysis + get a signed upload URL |
| PATCH | `/api/v1/analyses/{analysis_id}/` | ⭐ Premium | Confirm upload finished → start processing |
| GET | `/api/v1/analyses/` | 🔓 User | List the current user's analyses |
| GET | `/api/v1/analyses/{analysis_id}/` | 🔓 User | Get one analysis |
| GET | `/api/v1/analyses/{analysis_id}/video-url/` | 🔓 User | Signed URL to download the original video |
| GET | `/api/v1/analyses/{analysis_id}/issues/` | 🔓 User | Issues detected in this analysis |
| GET | `/api/v1/analyses/by-issue/{issue_id}/` | 🔓 User | Issue-progress timeline: the user's swings since this issue was first detected, each annotated with the AI's confidence for this issue (`confidence`, `detected`) |
| DELETE | `/api/v1/analyses/{analysis_id}/` | 🔓 User | Delete an analysis and its data |
| DELETE | `/api/v1/analyses/issues/{analysis_issue_id}/` | 🔓 User | Remove a single detected issue |

---

## 2. The upload + analyze flow

Creating an analysis is a three-step flow because the video is uploaded directly to
storage, not through the API:

```
1. POST /analyses/                → { analysis_id, upload_url }
2. PUT the video file to upload_url   (direct to storage, not this API)
3. PATCH /analyses/{analysis_id}/  → marks upload complete, starts AI processing
4. Poll GET /analyses/{analysis_id}/ until status is done
```

### 2.1 `POST /api/v1/analyses/` ⭐

Creates the analysis record and returns a signed URL to upload the video to.

Request body:
```json
{
  "model": null,
  "start_time": 0.0,
  "end_time": 3.5,
  "prompt_shape": "draw",
  "prompt_height": "low",
  "prompt_misses": "slice",
  "prompt_extra": "optional notes"
}
```
- `start_time` / `end_time` (seconds, required) — the trim window of the swing in the video.
- `model`, `prompt_*` (optional) — analysis hints that steer the AI.

Response `201`:
```json
{
  "success": true,
  "analysis_id": "f1e2...",
  "upload_url": "https://<storage>/...signed..."
}
```
Upload the video file with an HTTP `PUT` to `upload_url`. That URL is short-lived.

### 2.2 `PATCH /api/v1/analyses/{analysis_id}/` ⭐

Call this once the upload to `upload_url` has completed. It triggers AI processing
and returns the analysis (now processing).

Request: no body. Response `200`: a full analysis object (see §3.1).

---

## 3. Reading results

### 3.1 `GET /api/v1/analyses/{analysis_id}/` and `GET /api/v1/analyses/` 🔓

A single analysis, or the list of the current user's analyses (list items include a
`thumbnail_url`).

```json
{
  "analysis_id": "f1e2...",
  "user_id": "a1b2...",
  "video_id": "c3d4...",
  "model_version": "v1",
  "status": "completed",
  "success": true,
  "error_message": null,
  "thumbnail_url": "https://...",
  "created_at": "2026-06-11T10:00:00Z",
  "started_at": "2026-06-11T10:00:05Z",
  "completed_at": "2026-06-11T10:00:40Z"
}
```
- `status` — lifecycle of the analysis (e.g. processing → completed/failed). Poll this after `PATCH`.
- `success` / `error_message` — outcome once processing finishes.

### 3.2 `GET /api/v1/analyses/{analysis_id}/issues/` 🔓

The swing issues the AI detected for this analysis. Each is a link between the
analysis and an issue in the [issue library](./issues.md), with a confidence score:

```json
[
  {
    "analysis_issue_id": "aa11...",
    "analysis_id": "f1e2...",
    "issue_id": "99cc...",
    "confidence": 0.82,
    "created_at": "2026-06-11T10:00:40Z"
  }
]
```
Use `issue_id` with the [Issues API](./issues.md) to fetch the human-readable
description and recommended drills.

### 3.3 `GET /api/v1/analyses/{analysis_id}/video-url/` 🔓

A fresh signed URL to download/replay the original uploaded video:
```json
{ "success": true, "video_url": "https://<storage>/...signed..." }
```

---

## 4. Deleting

- `DELETE /api/v1/analyses/{analysis_id}/` 🔓 — removes the analysis and associated data. Returns `204`.
- `DELETE /api/v1/analyses/issues/{analysis_issue_id}/` 🔓 — removes a single detected issue from an analysis (e.g. the user dismisses a false positive). Returns `204`.

---

## 5. What the user gets

This is the heart of the product: turn a phone video of a swing into a structured,
AI-generated list of faults (issues), each tied to drills that fix it. Creating and
running analyses is **premium-gated**; browsing and managing existing results is
available to any authenticated user.
