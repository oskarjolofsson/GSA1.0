import { useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import useActivity from 'features/home/hooks/useActivity';
import useAreas from 'features/home/hooks/useAreas';
import useIssues from 'features/home/hooks/useIssues';
import usePrograms from 'features/programs/hooks/usePrograms';
import { deriveActivityStats } from 'features/home/utils/activityStats';
import { pickGreeting, greetingStateFor, dayKeyFor } from 'features/home/utils/greeting';
import type { Issue } from 'features/issues/types';
import type { ProgramSummary } from 'features/programs/types';
import type { TaxonomyTerm } from 'features/library/services/taxonomyService';

/**
 * Everything the home screen renders from, and the derivations over it -- notably which area
 * is selected and which issues are still startable.
 *
 * Three requests fire on focus: activity, issues, programs. Deliberately NOT
 * /issues/todays-issue/; the default tab is derived from the programs already in hand.
 */
export default function useHomeData(selectedArea: string | null, name?: string | null) {
  const activity = useActivity();
  const { areas, loading: areasLoading } = useAreas();
  const { issues, loading: issuesLoading, refetch: refetchIssues } = useIssues();
  const {
    programs,
    byArea,
    activeIssueIds,
    loading: programsLoading,
    refetch: refetchPrograms,
  } = usePrograms();

  const {
    counts,
    loading: activityLoading,
    error: activityError,
    refetch: refetchActivity,
  } = activity;

  useFocusEffect(
    useCallback(() => {
      refetchActivity();
      refetchIssues();
      refetchPrograms();
    }, [refetchActivity, refetchIssues, refetchPrograms])
  );

  const countByArea = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [key, list] of Object.entries(byArea)) out[key] = list.length;
    return out;
  }, [byArea]);

  // The golfer's choice wins as long as it still names a real area; otherwise
  // fall back to the newest open program's area, then the first area. Guarding
  // against a stale key matters because the taxonomy is admin-editable — an area
  // can be retired while someone has it selected.
  const resolvedArea =
    selectedArea && areas.some((a) => a.key === selectedArea)
      ? selectedArea
      : (programs[0]?.area ?? areas[0]?.key ?? null);

  const areaTerm: TaxonomyTerm | null = areas.find((a) => a.key === resolvedArea) ?? null;
  const areaPrograms: ProgramSummary[] = resolvedArea ? (byArea[resolvedArea] ?? []) : [];

  // Startable issues come from the PROGRAMS list, never from issue.program_status.
  // The two arrive on separate requests, so mid-refresh that flag can be stale
  // and the same issue would render as a program AND a suggestion, with two
  // Start buttons. Programs are the authority; the worst case this way is a
  // brief omission from the suggestion list, which nobody notices.
  const startable: Issue[] = useMemo(
    () => issues.filter((i) => i.area === resolvedArea && i.id && !activeIssueIds.has(i.id)),
    [issues, resolvedArea, activeIssueIds]
  );

  const stats = useMemo(() => deriveActivityStats(counts), [counts]);

  const areaCount = Object.keys(byArea).length;
  const greeting = pickGreeting(
    greetingStateFor(areaCount),
    dayKeyFor(new Date()),
    name,
    areaTerm?.golfer_label,
    areaCount
  );

  // Wait for everything only on a genuinely cold start, so a returning golfer
  // never sees a spinner over data that is already on screen.
  const firstLoad =
    (activityLoading || issuesLoading || programsLoading || areasLoading) &&
    counts.length === 0 &&
    programs.length === 0;

  return {
    areas,
    issues,
    programs,
    countByArea,
    resolvedArea,
    areaTerm,
    areaPrograms,
    startable,
    stats,
    greeting,
    /** False only when the golfer has nothing open and nothing diagnosed. */
    hasAnything: programs.length > 0 || issues.length > 0,
    firstLoad,
    activityError,
    counts,
    refetchActivity,
    refetchIssues,
    refetchPrograms,
  };
}
