# Analysis walks miss → law → issue, in one AI call

v1 handed Gemini the video, the golfer's free-text notes and every issue in the database,
and let it pick up to two. Nothing tied the choice to what the golfer actually saw, a
putting issue could be offered for a full-swing video, and the whole call ran inside the
HTTP request.

v2 (`/api/v2/analyses/`, `core/services/analysis_v2_service.py`) diagnoses through the
laws of ball flight (face, path, centeredness, angle of attack, dynamic loft, speed; see
swingdictionary.golf/laws-of-ball-flight). The golfer picks an **area** and a **miss** from
the taxonomy; the miss narrows the **laws** that can cause it (`taxonomy_miss_laws`, ranked);
each law has the **issues** in that area that break it (`issue_laws`, ranked); each issue has
its drills (`issue_drill`). The AI picks one law and the issues under it that the video
shows.

## Consequences

**Coach rankings are priors, not answers.** Both junctions carry a `rank`, authored by a
coach: how likely a law is behind a miss, how often an issue breaks a law. The prompt
presents candidates in that order and says so, but the video decides. The saved issues
are ordered by the AI's confidence, not by rank, so `analysis_issues` has no rank column.

**The AI can only answer with candidates.** `build_candidates` (pure, database only) runs
before the paid call and fails the analysis if nothing is linked, rather than asking
Gemini to choose from an empty list. The response schema is built per call with the
candidate law keys and issue ids as enums, and `validate_result` still checks the answer:
an unknown law fails the analysis; stray issue ids are dropped; at most three issues at
confidence ≥ 0.5 are kept. A valid law with no valid issue still completes.

**One call, not a chain.** The law and the issue are one diagnosis: the visible fault is
the evidence for the law, so the model chooses the law while seeing every candidate issue.
Splitting would send the video twice and make a wrong law unrecoverable. An `observation`
field written before the law is the reasoning step. Revisit only if measured law accuracy
is the weak point.

**A miss with no law links falls back to every law.** A new miss works before a coach maps
it; the ranking only sharpens it.

**The run is a background job.** `POST /start/` claims the analysis with a conditional
UPDATE (so a double tap cannot start it twice), commits, and returns 202; `execute_analysis`
runs on its own session after the response and never raises — every failure ends as a
`failed` row with a client-safe message. The commit sits in the service because FastAPI
runs background tasks before the request's `get_db` commit. A job that dies with its worker
stays `processing`, so the status read marks one older than ten minutes as failed. There
is no retry; a queue table and a worker are the upgrade if that is ever needed.

**The AI layer takes plain data.** `core/infrastructure/ai/` is Gemini only, and
`gemini.py` is the one module that calls it. Jobs take dicts and return dicts; they never
read the database or import services (`tests/test_layer_boundaries.py` enforces it). v1
read issues itself, which is how other users' private custom issues reached its prompt.

**v1 stays until no app build uses it.** Both versions share the tables. The v2 columns
(`prompts.area / miss / notes / club_type / camera_view`, `analysis.law`) are nullable, so v1
is untouched; a v2 analysis is one whose prompt has an area. Deleting v1 means removing
`analysis_service.run_analysis`, `ai/swing_analysis_v1.py` and, in a later migration, the
`prompt_*` columns.

**Rollout order.** Migrations first (all additive, safe for the shipped app), then the
backend. Then coaches link misses to laws and rank issues under each law — until they do,
every v2 analysis for that miss fails at `build_candidates`, which is the intended signal.
The app build that calls v2 ships last.
