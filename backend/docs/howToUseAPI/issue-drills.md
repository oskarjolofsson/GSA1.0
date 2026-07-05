# Issue–Drill Mappings — How To Use

An **issue–drill** is the link that says "this drill fixes this issue." These mappings
are what let the app answer "what should I practice for this fault?" Managing them is
**admin-only**; end users consume the result through
[`/drills/by-issue/{issue_id}/`](./drills.md) and
[`/issues/by-drill/{drill_id}/`](./issues.md).

All routes are under `/api/v1/issue-drills` and require an **admin** bearer token. See
[README](./README.md) for the auth model.

---

## 1. Endpoints (all 🛡 Admin)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/issue-drills/` | Link an issue to a drill |
| GET | `/api/v1/issue-drills/{issue_drill_id}/` | Get one mapping |
| GET | `/api/v1/issue-drills/issue/{issue_id}/` | All mappings for an issue |
| GET | `/api/v1/issue-drills/drill/{drill_id}/` | All mappings for a drill |
| DELETE | `/api/v1/issue-drills/{issue_drill_id}/` | Remove a mapping |

---

## 2. Creating a mapping

### `POST /api/v1/issue-drills/` 🛡

```json
{ "issue_id": "99cc...", "drill_id": "77aa..." }
```
Response `201`:
```json
{ "success": true, "issue_drill_id": "33ee..." }
```

## 3. Reading mappings

All GET routes return the mapping object (or a list of them):
```json
{
  "id": "33ee...",
  "issue_id": "99cc...",
  "drill_id": "77aa...",
  "created_at": "2026-06-01T12:00:00Z"
}
```
`issue/{issue_id}/` and `drill/{drill_id}/` return every mapping on that side of the
relationship. A missing id returns `404`.

## 4. Deleting a mapping

`DELETE /api/v1/issue-drills/{issue_drill_id}/` 🛡 returns:
```json
{ "success": true }
```
(`404` if the mapping does not exist.)

---

## 5. What this enables

The mappings are the connective tissue of the catalog. They don't appear directly in
the user UI, but every "recommended drills for this issue" list the user sees is
driven by them. Curating mappings well is how an admin keeps the AI's detected issues
pointing at genuinely useful drills.
