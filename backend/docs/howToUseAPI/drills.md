# Drills — How To Use

A **drill** is a practice exercise that fixes a swing [issue](./issues.md). Drills are
a shared catalog: users read them (usually via the issue they're practicing); admins
create and edit them.

All routes are under `/api/v1/drills` and require a bearer token. See
[README](./README.md) for the auth model and access-level marks.

---

## 1. Endpoints

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/api/v1/drills/{drill_id}/` | 🔓 User | One drill's details |
| GET | `/api/v1/drills/by-analysis/{analysis_id}/` | 🔓 User | Drills relevant to an analysis |
| GET | `/api/v1/drills/by-issue/{issue_id}/` | 🔓 User | Drills that fix a given issue |
| POST | `/api/v1/drills/` | 🔓 User | Create a drill |
| GET | `/api/v1/drills/all/` | 🛡 Admin | Every drill in the catalog |
| PATCH | `/api/v1/drills/{drill_id}/` | 🛡 Admin | Update a drill |
| DELETE | `/api/v1/drills/{drill_id}/` | 🛡 Admin | Delete a drill |
| DELETE | `/api/v1/drills/bulk/` | 🛡 Admin | Delete many drills |

---

## 2. Reading drills (user)

### 2.1 `GET /api/v1/drills/{drill_id}/` 🔓

```json
{
  "id": "77aa...",
  "title": "Chair drill",
  "task": "Make slow swings keeping your trail glute on the chair.",
  "success_signal": "Trail hip stays back through impact.",
  "fault_indicator": "Hips slide toward the ball.",
  "created_at": "2026-06-01T12:00:00Z"
}
```
- `task` — what to do.
- `success_signal` — what a good rep looks like.
- `fault_indicator` — the mistake to watch for.

Returns `404` if the drill does not exist.

### 2.2 `by-issue` / `by-analysis` 🔓

`GET /api/v1/drills/by-issue/{issue_id}/` is the common one: the drills mapped to an
issue the user is working on. `by-analysis/{analysis_id}/` returns drills relevant to
a whole analysis. Both return a list of the object above.

---

## 3. Creating & managing

### 3.1 `POST /api/v1/drills/` 🔓

```json
{
  "title": "Chair drill",
  "task": "Make slow swings keeping your trail glute on the chair.",
  "success_signal": "Trail hip stays back through impact.",
  "fault_indicator": "Hips slide toward the ball."
}
```
All four fields are required. Response `201`:
```json
{ "success": true, "drill_id": "77aa..." }
```

### 3.2 Update / delete 🛡

- `PATCH /api/v1/drills/{drill_id}/` — any subset of the create fields; returns the updated drill (`404` if missing).
- `DELETE /api/v1/drills/{drill_id}/` — returns `204`.
- `DELETE /api/v1/drills/bulk/` with `{ "drill_ids": ["...", "..."] }` — returns `204`.

To control which issues a drill fixes, use the
[issue–drill mappings API](./issue-drills.md).

---

## 4. What the user gets

Drills are the actionable half of the product: for every detected issue, a concrete
exercise with a clear "you're doing it right" signal. Users practice them and log
results through [practice sessions](./practice-sessions.md); admins curate the
catalog and map drills to issues.
