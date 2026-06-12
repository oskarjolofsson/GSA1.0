# Issues — How To Use

An **issue** is a golf-swing fault (e.g. "early extension in the downswing"). Issues
form a shared library: the AI links analyses to issues, and each issue maps to
[drills](./drills.md) that fix it. End users **read** issues; only admins create or
edit them.

All routes are under `/api/v1/issues` and require a bearer token. See
[README](./README.md) for the auth model and access-level marks.

---

## 1. Endpoints

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/api/v1/issues/` | 🔓 User | Issues in the current user's library (from their analyses) |
| GET | `/api/v1/issues/{issue_id}/` | 🔓 User | One issue's details |
| GET | `/api/v1/issues/by-analysis/{analysis_id}/` | 🔓 User | Issues for a given analysis |
| GET | `/api/v1/issues/by-drill/{drill_id}/` | 🔓 User | Issues a given drill addresses |
| GET | `/api/v1/issues/all/` | 🛡 Admin | Every issue in the catalog |
| POST | `/api/v1/issues/` | 🛡 Admin | Create an issue |
| PATCH | `/api/v1/issues/{issue_id}/` | 🛡 Admin | Update an issue |
| DELETE | `/api/v1/issues/{issue_id}/` | 🛡 Admin | Delete an issue |
| DELETE | `/api/v1/issues/bulk/` | 🛡 Admin | Delete many issues |

---

## 2. Reading issues (user)

### 2.1 `GET /api/v1/issues/{issue_id}/` 🔓

```json
{
  "id": "99cc...",
  "title": "Early extension",
  "phase": "DOWNSWING",
  "description": "Hips thrust toward the ball through impact.",
  "current_motion": "Pelvis moves toward the ball line",
  "expected_motion": "Pelvis rotates while maintaining posture",
  "swing_effect": "Loss of space for the arms",
  "shot_outcome": "Blocks and hooks",
  "created_at": "2026-06-01T12:00:00Z",
  "analysis_issue_id": "aa11...",
  "analysis_id": "f1e2...",
  "confidence": 0.82,
  "progress": {
    "completed_sessions": 3,
    "total_successful_reps": 41,
    "overall_success_rate": 0.78,
    "recent_session_success_rates": 0.85,
    "delta": 0.07,
    "last_completed_at": "2026-06-10T18:00:00Z"
  }
}
```
- `phase` — swing phase: `SETUP, BACKSWING, TRANSITION, DOWNSWING, IMPACT, FOLLOW_THROUGH`.
- `analysis_issue_id` / `analysis_id` / `confidence` — present when the issue is
  surfaced in the context of a specific analysis.
- `progress` — practice progress for this issue when available (sessions completed,
  success rate, and `delta` vs earlier sessions). `null` if the user hasn't practiced it.

### 2.2 The list/filter routes 🔓

`GET /api/v1/issues/` returns the user's issues; `by-analysis/{analysis_id}/` and
`by-drill/{drill_id}/` filter to a specific analysis or drill. All return a list of
the object above.

---

## 3. Managing the catalog (admin)

### 3.1 `POST /api/v1/issues/` 🛡

```json
{
  "title": "Early extension",
  "description": "Hips thrust toward the ball through impact.",
  "phase": "DOWNSWING",
  "current_motion": "...",
  "expected_motion": "...",
  "swing_effect": "...",
  "shot_outcome": "..."
}
```
`title` and `description` are required; the rest are optional. Response `201`:
```json
{ "success": true, "issue_id": "99cc..." }
```

### 3.2 Update / delete 🛡

- `PATCH /api/v1/issues/{issue_id}/` — any subset of the create fields; returns the updated issue.
- `DELETE /api/v1/issues/{issue_id}/` — returns `204`.
- `DELETE /api/v1/issues/bulk/` with `{ "issue_ids": ["...", "..."] }` — returns `204`.

---

## 4. What the user gets

Issues are the vocabulary that connects "what's wrong with my swing" to "what to
practice." A user browses the issues found in their analyses, sees a plain-language
description and the effect on their shots, and follows the issue's mapped
[drills](./drills.md). Editing the catalog is admin-only so the library stays
consistent for everyone.
