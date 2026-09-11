import { fetchPublic } from "lib/apiClient";
import { routes } from "lib/api/routes";
import type { Schemas } from "lib/api/types";

/** Areas and startable focus points, served without a token for the pre-signup intro. */
export type OnboardingCatalog = Schemas["OnboardingCatalogResponse"];
export type IntroArea = Schemas["TaxonomyTermSchema"];
export type IntroIssue = Schemas["CatalogIssueSchema"];

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

/** Areas with at least one startable focus point.
 *
 *  An area with nothing in it is a dead end, and the intro has no "nothing here
 *  yet" story to tell someone who has not signed up — they would simply back out.
 *  The library can afford to show all five because it has somewhere to send them. */
export function areasWithIssues(catalog: OnboardingCatalog): IntroArea[] {
    return catalog.areas.filter((area) => issuesForArea(catalog.issues, area.key).length > 0);
}
