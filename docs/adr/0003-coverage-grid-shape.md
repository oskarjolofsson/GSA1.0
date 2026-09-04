# The coverage grid is taxonomy-generated, outer-joined and area-scoped

`admin_content_service.coverage` builds its cells from the taxonomy rather than from
the data, so a combination with no issues still appears — an absent row is exactly the
gap the grid exists to show.

## Consequences

**Outer joins, not inner.** An issue with no miss or goal tags used to produce zero
rows and vanish from the grid entirely, invisible in the one tool built to find
untagged content. With ~30 issues to author across four new areas that stopped being a
curiosity. Such issues key on NULL, which no `(area, miss, goal)` triple can reach, so
`untagged_issues` surfaces the count directly.

**Cells scoped by area, not a cross-product.** Misses belong to exactly one area (see
ADR-0001), so iterating every area against every miss would emit CHIPPING x SLICE and
similar — permanently unfillable cells reading as gaps forever. The old shape produced
5 x 8 x 6 = 240 cells, most of them nonsense.

**Reachability is asymmetric by kind, so it is counted separately.** A `fault` issue is
reachable through its misses with no goal tag at all, but a `skill` issue is listed only
under its goals — with none it falls out of the library tree entirely and can be found
only by search. That is invisible from the grid, hence `goalless_skill_issues`.
