# Users — How To Use

Account-level operations: list all users (admin) and delete an account.

All routes are under `/api/v1/users` and require a bearer token. See
[README](./README.md) for the auth model and access-level marks.

---

## 1. Endpoints

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/api/v1/users/all/` | 🛡 Admin | List every user |
| DELETE | `/api/v1/users/{user_id}/` | 🔓 User | Delete an account |

---

## 2. `GET /api/v1/users/all/` 🛡

Returns every user with profile and activity summary:
```json
[
  {
    "id": "a1b2...",
    "email": "golfer@example.com",
    "name": "Sam Golfer",
    "role": "user",
    "authProvider": "google",
    "active": true,
    "analysesCount": 12,
    "drillsCompleted": 87,
    "created_at": "2026-05-01T09:00:00Z",
    "updated_at": "2026-06-10T18:00:00Z"
  }
]
```
This powers the admin "Users" table (counts of analyses and completed drills per user).

## 3. `DELETE /api/v1/users/{user_id}/` 🔓

Deletes an account and returns `204`. The **actor** is taken from the auth token, so a
regular user can delete their **own** account; the path `user_id` identifies the
target. Deleting another user's account requires the appropriate privileges enforced
by the backend.

---

## 4. What the user gets

For a regular user, this is the "delete my account" action. For an admin, `/all/` is
the roster behind the admin dashboard's user management.
