import { fetchPublic } from "lib/apiClient";
import { routes } from "lib/api/routes";
import type { Schemas } from "lib/api/types";

/** Areas and startable focus points, served without a token for the pre-signup intro. */
export type OnboardingCatalog = Schemas["OnboardingCatalogResponse"];
export type IntroArea = Schemas["TaxonomyTermSchema"];
export type IntroIssue = Schemas["CatalogIssueSchema"];
export type IntroMiss = Schemas["TaxonomyMissSchema"];
export type IntroGoal = Schemas["TaxonomyTermSchema"];
/** The label the intro's branch step shows: a miss under "fix an issue", a goal
 *  under "get better". Same shape either way — `blurb` is optional on both. */
export type IntroBranch = IntroMiss | IntroGoal;

/**
 * The intro's whole data need, in one unauthenticated call.
 *
 * Nothing is cached here, unlike `taxonomyService`. That cache exists so a
 * returning golfer's library paints offline; this screen is shown once, before
 * an account exists, and a stale copy of it would be a first impression built
 * from month-old content.
 */
export async function getOnboardingCatalog(): Promise<OnboardingCatalog> {
    return fetchPublic<OnboardingCatalog>(routes.onboarding.catalog);
}

/** The area's focus points, in the order the backend sent them. */
export function issuesForArea(issues: IntroIssue[], areaKey: string): IntroIssue[] {
    return issues.filter((issue) => issue.area === areaKey);
}

/** The area's focus points narrowed to one kind: "skill" (get better at) or
 *  "fault" (fix). Backs the intro's goal-vs-issue step. */
export function issuesForAreaAndKind(
    issues: IntroIssue[],
    areaKey: string,
    kind: IntroIssue["kind"]
): IntroIssue[] {
    return issuesForArea(issues, areaKey).filter((issue) => issue.kind === kind);
}

/** The one more layer the signed-in library has: inside "fix an issue" branch by
 *  miss (`issue.misses`), inside "get better" branch by goal (`issue.goals`) — the
 *  same fork `features/library/utils/libraryFork.ts` navigates, minus admin-only
 *  concerns. Only branches with a startable issue behind them are offered, same
 *  reasoning as `areasWithIssues`. */
export function branchesFor(
    catalog: OnboardingCatalog,
    areaKey: string,
    kind: IntroIssue["kind"]
): IntroBranch[] {
    const issues = issuesForAreaAndKind(catalog.issues, areaKey, kind);
    const tagField = kind === "skill" ? "goals" : "misses";
    const tagged = new Set<string>();
    for (const issue of issues) for (const tag of issue[tagField] ?? []) tagged.add(tag);

    const source = kind === "skill" ? catalog.goals : catalog.misses.filter((m) => m.area === areaKey);
    return source.filter((branch) => tagged.has(branch.key));
}

/** Focus points behind one branch of the fork. */
export function issuesForBranch(
    catalog: OnboardingCatalog,
    areaKey: string,
    kind: IntroIssue["kind"],
    branchKey: string
): IntroIssue[] {
    const tagField = kind === "skill" ? "goals" : "misses";
    return issuesForAreaAndKind(catalog.issues, areaKey, kind).filter((issue) =>
        (issue[tagField] ?? []).includes(branchKey)
    );
}

/** Areas with at least one startable focus point.
 *
 *  An area with nothing in it is a dead end, and the intro has no "nothing here
 *  yet" story to tell someone who has not signed up — they would simply back out.
 *  The library can afford to show all five because it has somewhere to send them. */
export function areasWithIssues(catalog: OnboardingCatalog): IntroArea[] {
    return catalog.areas.filter((area) => issuesForArea(catalog.issues, area.key).length > 0);
}
