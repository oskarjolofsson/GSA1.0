import { useCallback, useEffect, useMemo, useState } from "react";

import { getErrorMessage } from "lib/errors";

import {
    areasWithIssues,
    branchesFor,
    getOnboardingCatalog,
    issuesForBranch,
    type IntroArea,
    type IntroBranch,
    type IntroIssue,
    type OnboardingCatalog,
} from "../services/introCatalogService";

type FetchStatus = "loading" | "ready" | "error";

/** The intro's catalog fetch, plus the derived lists its two picking screens read. */
export function useIntroCatalog() {
    const [catalog, setCatalog] = useState<OnboardingCatalog | null>(null);
    const [status, setStatus] = useState<FetchStatus>("loading");
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setStatus("loading");
        setError(null);
        try {
            setCatalog(await getOnboardingCatalog());
            setStatus("ready");
        } catch (err) {
            setError(getErrorMessage(err));
            setStatus("error");
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const areas: IntroArea[] = useMemo(
        () => (catalog ? areasWithIssues(catalog) : []),
        [catalog]
    );

    const branchesIn = useCallback(
        (areaKey: string, kind: IntroIssue["kind"]): IntroBranch[] =>
            catalog ? branchesFor(catalog, areaKey, kind) : [],
        [catalog]
    );

    const issuesOn = useCallback(
        (areaKey: string, kind: IntroIssue["kind"], branchKey: string): IntroIssue[] =>
            catalog ? issuesForBranch(catalog, areaKey, kind, branchKey) : [],
        [catalog]
    );

    return { areas, branchesIn, issuesOn, status, error, retry: load };
}
