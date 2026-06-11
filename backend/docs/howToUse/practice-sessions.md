# Practice Sessions — How To Use

Practice sessions track a user actually doing drills: a **session** groups one or
more **drill runs**, and each run records successful/failed reps. This is what powers
the progress numbers shown on [issues](./issues.md).

All routes are under `/api/v1/practice` and require a bearer token. See
[README](./README.md) for the auth model and access-level marks.

---

## 1. Endpoints

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| POST | `/api/v1/practice/sessions/start/` | ⭐ Premium | Start a practice session |
| POST | `/api/v1/practice/sessions/{session_id}/complete/` | 🔓 User | Mark a session complete |
| GET | `/api/v1/practice/sessions/{session_id}/` | 🔓 User | Get a session |
| POST | `/api/v1/practice/sessions/{session_id}/drills/start/` | ⭐ Premium | Start a drill run in a session |
| POST | `/api/v1/practice/drill-runs/complete/` | 🔓 User | Complete a drill run with reps |
| GET | `/api/v1/practice/sessions/{session_id}/results/` | 🔓 User | All drill runs for a session |

---

## 2. The practice flow

```
1. POST /sessions/start/                         → session (status: in progress)
2. POST /sessions/{id}/drills/start/             → drill run (per drill)
3. POST /drill-runs/complete/                    → record reps for that run
   (repeat 2–3 for each drill)
4. POST /sessions/{id}/complete/                 → session done
5. GET  /sessions/{id}/results/                  → review the session
```

### 2.1 `POST /api/v1/practice/sessions/start/` ⭐

```json
{ "analysis_issue_id": "aa11..." }
```
`analysis_issue_id` (optional) ties the session to a specific detected issue so its
progress rolls up onto that issue. Response `201`:
```json
{
  "id": "5577...",
  "user_id": "a1b2...",
  "analysis_issue_id": "aa11...",
  "status": "in_progress",
  "started_at": "2026-06-11T17:00:00Z",
  "completed_at": null
}
```

### 2.2 `POST /api/v1/practice/sessions/{session_id}/drills/start/` ⭐

```json
{ "drill_id": "77aa...", "order_index": 0 }
```
`order_index` (optional) orders drills within the session. Response `201`:
```json
{
  "id": "d1d1...",
  "drill_title": "Chair drill",
  "session_id": "5577...",
  "drill_id": "77aa...",
  "status": "in_progress",
  "successful_reps": 0,
  "failed_reps": 0,
  "skipped": false,
  "started_at": "2026-06-11T17:01:00Z",
  "completed_at": null
}
```

### 2.3 `POST /api/v1/practice/drill-runs/complete/` 🔓

Send the drill-run object back with the rep counts filled in:
```json
{
  "id": "d1d1...",
  "drill_title": "Chair drill",
  "session_id": "5577...",
  "drill_id": "77aa...",
  "status": "in_progress",
  "successful_reps": 8,
  "failed_reps": 2,
  "skipped": false,
  "started_at": "2026-06-11T17:01:00Z",
  "completed_at": null
}
```
The backend reads `id`, `successful_reps`, `failed_reps`, and `skipped`. Response is
the updated, completed drill run.

### 2.4 `POST /api/v1/practice/sessions/{session_id}/complete/` 🔓

No body. Marks the session complete and returns the session with `completed_at` set.

---

## 3. Reviewing

`GET /api/v1/practice/sessions/{session_id}/results/` 🔓 returns the list of drill
runs (with rep counts and status) for the session — the data behind the post-session
summary and the issue progress widget.

---

## 4. What the user gets

Structured practice with a paper trail: start a session against an issue, run its
drills, log how many reps went well, and watch the success rate trend over time
(`progress.delta` on the issue). **Starting** practice is premium-gated; completing
runs and reviewing results is available to any authenticated user mid-session.
