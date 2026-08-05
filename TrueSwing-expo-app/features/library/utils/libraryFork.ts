import type { CatalogIssue } from "features/issues/services/issueAuthoringService";
import type { TaxonomyMiss, TaxonomyTerm } from "../services/taxonomyService";

/** Level two under one area: the two branches a golfer can arrive on.
 *  "Something's going wrong" -> misses, "nothing's broken" -> goals. */
export type AreaFork = {
    misses: TaxonomyMiss[];
    goals: TaxonomyTerm[];
};

/** The split is `issue.kind`, never the presence of miss tags. `kind` is a
 *  deliberate statement about what a piece of content *is*; inferring it would
 *  let the library re-file an issue behind the author's back the moment someone
 *  added or removed a tag. */
export function isFaultIssue(issue: CatalogIssue): boolean {
    return issue.kind !== "skill";
}

export function issuesForArea(issues: CatalogIssue[], area: string): CatalogIssue[] {
    return issues.filter((issue) => issue.area === area);
}

/** Only branches with real content are offered. A miss nobody has written an
 *  issue for, or a goal with no skill focus in this area, is a dead end -- and
 *  the golfer finds that out after a tap rather than before. */
export function buildAreaFork(
    area: string,
    issues: CatalogIssue[],
    misses: TaxonomyMiss[],
    goals: TaxonomyTerm[]
): AreaFork {
    const inArea = issuesForArea(issues, area);
    const faults = inArea.filter(isFaultIssue);
    const skills = inArea.filter((issue) => !isFaultIssue(issue));

    const tagged = new Set<string>();
    for (const issue of faults) for (const miss of issue.misses ?? []) tagged.add(miss);

    const wanted = new Set<string>();
    for (const issue of skills) for (const goal of issue.goals ?? []) wanted.add(goal);

    return {
        misses: misses.filter((miss) => tagged.has(miss.key)),
        goals: goals.filter((goal) => wanted.has(goal.key)),
    };
}

/** Issues behind one branch of the fork. */
export function issuesForMiss(issues: CatalogIssue[], area: string, miss: string): CatalogIssue[] {
    return issuesForArea(issues, area).filter(
        (issue) => isFaultIssue(issue) && (issue.misses ?? []).includes(miss)
    );
}

export function issuesForGoal(issues: CatalogIssue[], area: string, goal: string): CatalogIssue[] {
    return issuesForArea(issues, area).filter(
        (issue) => !isFaultIssue(issue) && (issue.goals ?? []).includes(goal)
    );
}

/** Flat search over focus points, bypassing the hierarchy. It matches the
 *  issue's own text plus its area and miss labels, so typing "bunker" finds the
 *  Bunker area's content rather than only issues that use the word. */
export function searchIssues(
    issues: CatalogIssue[],
    query: string,
    labelsForIssue: (issue: CatalogIssue) => string
): CatalogIssue[] {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return issues.filter((issue) =>
        `${issue.layman_title ?? ""} ${issue.title} ${issue.layman_desc ?? ""} ${
            issue.description ?? ""
        } ${labelsForIssue(issue)}`
            .toLowerCase()
            .includes(needle)
    );
}
