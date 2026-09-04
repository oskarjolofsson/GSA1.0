# The admin forms duplicate some server-side validation on purpose

`features/content/drill-metric-payload.ts` mirrors `backend/core/services/drill_metrics.validate_metric`,
`taxonomy-payload.normalizeKey` mirrors the server's key normalisation, and `IssueForm.changeArea`
prunes cross-area misses the way `update_issue` does. The server stays authoritative and
returns a 422 naming the field; the client copy exists so the admin sees the mistake while
authoring instead of on save.

The trade-off is accepted because the content the copies cover is fiddly and written in bulk:
a metric is four numbers, two of them proportions, and roughly forty misses have to be
authored. Discovering an error one save at a time is a bad deal for that person.

## Consequences

The duplication is bounded to these three rules and does not grow. If the client and the
server ever disagree, the server is right and the client is the bug.

Doing the tag pruning client-side is not redundant with the server doing it: it means the
admin watches stale tags drop rather than discovering it in the response.
