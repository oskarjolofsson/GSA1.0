# Programs — How To Use

A **program** is an adaptive practice plan built around one detected issue. Instead of
a fixed list of sessions, the program **schedules the next session on demand** and adapts
to how the golfer says each drill felt — concentrating range time on what still feels
rough and letting grooved drills fade. It is the spine behind the "a concrete plan you'll
actually stick to" experience.

All routes are under `/api/v1/programs` and require a bearer token. See
[README](./README.md) for the auth model and access-level marks.

---

## 1. Endpoints

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| POST | `/api/v1/programs/generate/` | ⭐ Premium | Create (or fetch) the active program for an issue |
| GET | `/api/v1/programs/active/` | 🔓 User | The user's active program for an issue, or `null` |
| GET | `/api/v1/programs/{program_id}/` | 🔓 User | A program with its step history |
| GET | `/api/v1/programs/{program_id}/next-step/` | 🔓 User | The next session to do (scheduled on demand) |
| POST | `/api/v1/programs/{program_id}/steps/{step_id}/complete/` | 🔓 User | Mark a session done and submit feel grades |

---

## 2. Concepts

### Session types

Every step the program prescribes is one of three **session types**:

| Type | What the golfer does | `prescription` payload |
|------|----------------------|------------------------|
| `range` | Hit blocks on the range working specific drills | `{ "drill_ids": [...], "num_blocks": int, "cue": str\|null }` |
| `play` | Play 9 holes holding one swing thought | `{ "holes": 9, "focus": str }` |
| `retest` | Film one swing to self-compare over time | `{ "instruction": str }` |

### How it adapts (spaced repetition)

Each drill in a program carries a hidden **strength** (0–5). When a `range` session is
completed, the golfer's per-drill feel grade moves it:

| Grade | Effect on strength |
|-------|--------------------|
| `dialed` | +1 (caps at 5) |
| `ok` | unchanged |
| `rough` | −1 (floors at 0) |

The next `range` session is filled with the **lowest-strength drills**, so practice
keeps returning to whatever feels worst. A drill is **grooved** at strength ≥ 3.

### Open-ended progress

A program has **no fixed length**. It runs a repeating rhythm — `range, range, play`,
with a `retest` interleaved after every 6 work sessions — until the golfer has grooved
their drills or stops. Progress is reported as **`grooved_count` / `total_drills`**, not
an "X of N steps" bar.

---

## 3. The program flow

```
1. POST /generate/                          → program (active, no steps yet)
2. GET  /{id}/next-step/                     → the next session to do (range/play/retest)
3. (golfer does the session in the app)
4. POST /{id}/steps/{step_id}/complete/      → submit feel grades; schedules the next step
   (repeat 2–4 indefinitely; retests appear on cadence)
```

### 3.1 `POST /api/v1/programs/generate/` ⭐

```json
{ "analysis_issue_id": "aa11..." }
```

Creates the active program for that issue and seeds one drill per the issue's linked
drills. **Idempotent**: if an active program already exists for the issue, the existing
one is returned (no duplicate). Validates ownership — `404` if the issue does not exist,
`403` if it is not the caller's. Response `201`:

```json
{
  "id": "pp11...",
  "user_id": "a1b2...",
  "analysis_issue_id": "aa11...",
  "title": "Fix Early extension",
  "status": "active",
  "created_at": "2026-06-27T10:00:00Z",
  "grooved_count": 0,
  "total_drills": 3,
  "steps": []
}
```

### 3.2 `GET /api/v1/programs/active/?analysis_issue_id={id}` 🔓

Returns the caller's active program for the given issue, or the most recent active
program if `analysis_issue_id` is omitted. This is a **lookup**, not a resource fetch:
when there is no active program it returns `200` with a `null` body (not `404`). The home
screen calls this on load to decide between showing the program and offering to start one.
A bad/foreign issue id also yields `null` here — the validating endpoint is `/generate/`.

### 3.3 `GET /api/v1/programs/{program_id}/` 🔓

The full program (same shape as above), with `steps` containing the completed/pending
session history. `404` if the program does not exist or is not the caller's.

### 3.4 `GET /api/v1/programs/{program_id}/next-step/` 🔓

Returns the next session to do, **scheduling and persisting it** if one isn't already
pending. Calling it repeatedly returns the same pending step until it's completed.
Response `200`:

```json
{
  "id": "ss11...",
  "program_id": "pp11...",
  "order_index": 0,
  "session_type": "range",
  "prescription": { "drill_ids": ["77aa...", "88bb..."], "num_blocks": 2, "cue": null },
  "status": "pending",
  "practice_session_id": null
}
```

Returns `null` only if the program has no further steps (not expected for an open-ended
active program).

### 3.5 `POST /api/v1/programs/{program_id}/steps/{step_id}/complete/` 🔓

```json
{
  "practice_session_id": "5577...",
  "grades": [
    { "drill_id": "77aa...", "grade": "dialed" },
    { "drill_id": "88bb...", "grade": "rough" }
  ]
}
```

Both fields are optional. `practice_session_id` links the [practice
session](./practice-sessions.md) that fulfilled this step. `grades` (used for `range`
steps) feed the spaced-repetition state — omit them for `play`/`retest`. Marks the step
completed and **schedules the next one**. Response `200`:

```json
{
  "completed_step": { "id": "ss11...", "status": "completed", "...": "..." },
  "next_step": { "id": "ss22...", "session_type": "range", "status": "pending", "...": "..." },
  "program_status": "active",
  "grooved_count": 0,
  "total_drills": 3
}
```

`404` if the step doesn't belong to the program; `403` if the program isn't the caller's.

---

## 4. What the user gets

A practice plan that quietly reshapes itself around their own honest feedback: the range
work keeps coming back to the drills that feel worst, on-course "play" sessions force the
fix to transfer, and periodic retests let them compare their own swing over time. There's
no fixed end — they make progress by grooving drills, not by ticking off a fixed list.
**Generating** a program is premium-gated; reading it, fetching the next session, and
completing sessions are available to any authenticated user.
