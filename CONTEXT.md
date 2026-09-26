# Domain glossary

The words this codebase uses for golf and practice. Use these terms in code, issues and
docs; the avoided synonyms are listed so they do not creep back in.

## The taxonomy

Vocabulary lives in `taxonomy_*` tables, editable from the admin dashboard, and reaches
the clients through `GET /taxonomy/` — never a hardcoded list in an app (ADR-0001, ADR-0008).

- **Area** — where on the course: full swing, chipping, pitching, bunker, putting.
  Everything below is scoped to one.
- **Miss** — what the golfer sees go wrong (slice, hook, fat, thin...). Belongs to exactly
  one area: a putt is not sliced. *Avoid:* "result", "shot shape" for this.
- **Goal** — why the golfer practices (straighter, contact...). Not area-scoped.
- **Law** (of ball flight) — the physical cause behind a miss: face, path, centeredness of
  contact, angle of attack, dynamic loft, speed. Not area-scoped.
- **Kind** — `fault` or `skill`. A structural flag in code, not vocabulary.

## Content

- **Issue** — a swing fault (or skill) the golfer can work on, in one area. Tagged with
  misses and goals; linked to the laws it breaks, with a coach **rank** per law.
  *Avoid:* "problem", "error".
- **Drill** — a practice exercise that fixes an issue. Has a task, a success signal and a
  fault indicator.
- **Catalog issue** — authored by an admin (`user_id` null), visible to everyone.
  **Custom issue** — authored by one user, visible only to them.

## Analysis

- **Analysis** — one filmed swing run through the AI. `awaiting_upload` → `processing` →
  `completed` | `failed`.
- **Candidate** — a law the miss can explain, with the issues in the area that break it:
  what the AI may choose from (ADR-0011).
- **v1 / v2 analysis** — v1 matches free-text notes against every issue; v2 walks
  miss → law → issue. Both live side by side until v1 is retired.

## Practice

- **Program** (focus) — a sequence of practice steps for one issue.
- **Practice session** — one sitting of drills, graded.
