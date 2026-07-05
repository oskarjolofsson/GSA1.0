# Feedback — How To Use

Lets a user send app feedback (a rating plus comments). Users submit; admins read.

All routes are under `/api/v1/feedback` and require a bearer token. See
[README](./README.md) for the auth model and access-level marks.

---

## 1. Endpoints

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| POST | `/api/v1/feedback/` | 🔓 User | Submit feedback |
| GET | `/api/v1/feedback/` | 🛡 Admin | List all feedback |

---

## 2. Submitting feedback

### `POST /api/v1/feedback/` 🔓

```json
{ "rating": 5, "comments": "Loving the drill suggestions." }
```
- `rating` (int) — e.g. 1–5.
- `comments` (str) — free text.

Response `201`:
```json
{ "success": true, "feedback_id": "ab12..." }
```
The submitting user is taken from the auth token; no `user_id` is sent.

## 3. Reading feedback (admin)

### `GET /api/v1/feedback/?limit=100` 🛡

`limit` query param (default 100, max 1000). Response:
```json
[
  {
    "id": "ab12...",
    "user_id": "a1b2...",
    "rating": 5,
    "comments": "Loving the drill suggestions.",
    "created_at": "2026-06-11T19:00:00Z"
  }
]
```

---

## 4. What the user gets

A one-call way to tell the team what's working and what isn't. The user only ever
needs the `POST`; the admin list feeds an internal review of recent feedback.
