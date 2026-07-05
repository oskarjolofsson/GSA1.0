# Admin — How To Use

Endpoints for the admin dashboard: aggregate stats and a check for whether the
current user is an admin.

All routes are under `/api/v1/admin` and require a bearer token. See
[README](./README.md) for the auth model and access-level marks.

---

## 1. Endpoints

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/api/v1/admin/verify/` | 🔓 User | Is the current user an admin? |
| GET | `/api/v1/admin/stats/` | 🛡 Admin | Dashboard statistics |

---

## 2. `GET /api/v1/admin/verify/` 🔓

Any authenticated user can call this; it just reports whether **they** are an admin.
Use it to decide whether to show admin UI.
```json
{ "is_admin": true }
```

## 3. `GET /api/v1/admin/stats/` 🛡

Counts for the admin dashboard overview:
```json
{
  "totalDrills": 120,
  "totalIssues": 64,
  "totalMappings": 210,
  "totalUsers": 1543,
  "unmappedDrills": 3,
  "issuesWithNoDrills": 2,
  "newUsersLast7Days": 48,
  "newUsersLast30Days": 191
}
```
- `unmappedDrills` / `issuesWithNoDrills` — catalog-health signals (drills not linked
  to any issue, and issues with no drills). Use the
  [issue–drill mappings API](./issue-drills.md) to fix them.
- `newUsersLast7Days` / `newUsersLast30Days` — growth signals.

---

## 4. What this enables

`verify/` is the gate the client uses to reveal admin features; `stats/` is the
at-a-glance health and growth view of the catalog and user base. The data-management
itself lives in the [issues](./issues.md), [drills](./drills.md), and
[issue–drill mappings](./issue-drills.md) APIs.
