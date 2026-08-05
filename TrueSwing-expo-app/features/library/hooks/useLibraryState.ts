import { useCallback, useEffect, useMemo, useState } from "react";

import { getIssueCatalog, type CatalogIssue } from "features/issues/services/issueAuthoringService";
import { getErrorMessage } from "lib/errors";

import {
    fetchTaxonomy,
    readCachedTaxonomy,
    type Taxonomy,
    type TaxonomyMiss,
    type TaxonomyTerm,
} from "../services/taxonomyService";
import { buildAreaFork, issuesForGoal, issuesForMiss, searchIssues } from "../utils/libraryFork";

export type LibraryView = "areas" | "focus" | "candidates";
/** Which branch of the fork the golfer took. `label` rides along so the leaf can
 *  title itself without re-resolving the term out of the taxonomy. The old
 *  `{ type: "skill" }` variant is gone: skill issues are now reached through
 *  their goals, so nothing could select a single one directly any more. */
export type CandidateFilter =
    | { type: "miss"; miss: string; label: string }
    | { type: "goal"; goal: string; label: string };

type FetchStatus = "loading" | "ready" | "error";

/** State, both fetches and the derived lists for the library. Extracted from the
 *  screen so the screen stays layout only (and under the ~200 line cap). */
export function useLibraryState() {
    const [taxonomy, setTaxonomy] = useState<Taxonomy | null>(null);
    const [taxonomyStatus, setTaxonomyStatus] = useState<FetchStatus>("loading");
    const [taxonomyError, setTaxonomyError] = useState<string | null>(null);

    const [issues, setIssues] = useState<CatalogIssue[]>([]);
    const [catalogStatus, setCatalogStatus] = useState<FetchStatus>("loading");
    const [catalogError, setCatalogError] = useState<string | null>(null);

    const [view, setView] = useState<LibraryView>("areas");
    const [area, setArea] = useState<TaxonomyTerm | null>(null);
    const [filter, setFilter] = useState<CandidateFilter | null>(null);
    const [query, setQuery] = useState("");

    const loadTaxonomy = useCallback(async () => {
        setTaxonomyStatus("loading");
        setTaxonomyError(null);
        // Paint from cache first: after the first launch the landing needs zero
        // network, and the request below just revalidates.
        const cached = await readCachedTaxonomy();
        if (cached) {
            setTaxonomy(cached);
            setTaxonomyStatus("ready");
        }
        try {
            setTaxonomy(await fetchTaxonomy());
            setTaxonomyStatus("ready");
        } catch (err) {
            if (!cached) {
                setTaxonomyError(getErrorMessage(err));
                setTaxonomyStatus("error");
            }
        }
    }, []);

    const loadCatalog = useCallback(async () => {
        setCatalogStatus("loading");
        setCatalogError(null);
        try {
            setIssues(await getIssueCatalog());
            setCatalogStatus("ready");
        } catch (err) {
            setCatalogError(getErrorMessage(err));
            setCatalogStatus("error");
        }
    }, []);

    // Deliberately NOT Promise.all: it rejects on the first failure, so a dead
    // issue catalog would destroy the taxonomy result and hide five working
    // areas behind a full-screen error. Each fetch owns its own status.
    useEffect(() => {
        loadTaxonomy();
        loadCatalog();
    }, [loadTaxonomy, loadCatalog]);

    const areas = useMemo(() => taxonomy?.areas ?? [], [taxonomy]);
    const goals = useMemo(() => taxonomy?.goals ?? [], [taxonomy]);
    const missesByArea = useMemo(() => taxonomy?.misses_by_area ?? {}, [taxonomy]);

    const fork = useMemo(
        () => (area ? buildAreaFork(area.key, issues, missesByArea[area.key] ?? [], goals) : null),
        [area, issues, missesByArea, goals]
    );

    // Search matches the issue's area and miss labels too, so a golfer typing
    // "bunker" reaches the Bunker area's content and not only issues that
    // happen to use the word.
    const labelsForIssue = useCallback(
        (issue: CatalogIssue) => {
            const areaLabel = areas.find((a) => a.key === issue.area)?.golfer_label ?? issue.area;
            const missLabels = (issue.misses ?? [])
                .map((key) => findMiss(missesByArea, issue.area, key)?.golfer_label ?? key)
                .join(" ");
            return `${areaLabel} ${missLabels}`;
        },
        [areas, missesByArea]
    );

    const candidates = useMemo(() => {
        if (query.trim()) return searchIssues(issues, query, labelsForIssue);
        if (view !== "candidates" || !filter || !area) return [];
        if (filter.type === "goal") return issuesForGoal(issues, area.key, filter.goal);
        return issuesForMiss(issues, area.key, filter.miss);
    }, [query, view, filter, area, issues, labelsForIssue]);

    const openArea = useCallback((next: TaxonomyTerm) => {
        setArea(next);
        setView("focus");
    }, []);

    const openFilter = useCallback((next: CandidateFilter) => {
        setFilter(next);
        setView("candidates");
    }, []);

    /** One step back up the hierarchy; returns false at the top so the caller
     *  can dismiss the whole screen. */
    const goBack = useCallback((): boolean => {
        if (query) { setQuery(""); return true; }
        if (view === "candidates") { setView("focus"); setFilter(null); return true; }
        if (view === "focus") { setView("areas"); setArea(null); return true; }
        return false;
    }, [query, view]);

    return {
        areas, area, fork, issues, candidates, view, filter, query,
        taxonomyStatus, taxonomyError, catalogStatus, catalogError,
        setQuery, openArea, openFilter, goBack,
        retryTaxonomy: loadTaxonomy, retryCatalog: loadCatalog,
    };
}

function findMiss(
    missesByArea: Record<string, TaxonomyMiss[]>,
    area: string,
    key: string
): TaxonomyMiss | undefined {
    return (missesByArea[area] ?? []).find((miss) => miss.key === key);
}
