# The landing page promises adherence, not accuracy, and keeps AI backstage

The marketing site sells a practice plan the golfer will stick to. It never leads with
"AI swing analysis" and makes no claim about how correct the analysis is. AI does the
diagnosis and plan generation, and stays out of the pitch.

The audience is the 15-5 handicap golfer who already knows their fault — not beginners,
not coaches. The FAQ answers were rewritten wholesale for this: the originals, ported
from the legacy `frontend/` landing page, led with "advanced AI analyses your swing",
promised a "personal coach available 24/7", pitched beginners and claimed desktop
support. All four were wrong after the pivot.

## Consequences

`content/landing.ts` and `content/faq.ts` are written to this rule, and any new copy
must be too. Much of `landing.ts` is lifted verbatim from the root `README.md`, which
carries the approved wording — change the pitch in both together.

`content/faq.ts` is the single source for both the rendered FAQ and the FAQPage
JSON-LD, so editing it changes the structured data Google sees.
