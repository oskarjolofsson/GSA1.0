import React, { useCallback, useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import HomeHero from 'features/home/components/HomeHero';
import AreaTabs from 'features/home/components/AreaTabs';
import HomeAreaBody from 'features/home/components/HomeAreaBody';
import StartableList from 'features/home/components/StartableList';
import StreakPanel from 'features/home/components/StreakPanel';
import ArchiveEntry from 'features/home/components/ArchiveEntry';
import LoadingState from 'features/shared/components/LoadingState';
import ErrorState from 'features/shared/components/ErrorState';

import { useAuth } from 'features/auth/AuthProvider';
import useHomeData from 'features/home/hooks/useHomeData';
import { pickHeroImage } from 'features/home/config/heroImages';
import IssueInfoModal from 'features/home/components/IssueInfoModal';
import { removeFocus } from 'features/programs/services/programService';
import analysisService from 'features/analysis/services/analysisService';
import type { Issue } from 'features/issues/types';

/** The screen's one tier-2 boundary: a .13 rule with real air either side. See ADR-0021. */
function Section({ children }: { children: React.ReactNode }) {
  return <View className="mt-9 border-t border-white/[.13] pt-7">{children}</View>;
}

/**
 * A .07 hairline separator between peers inside the secondary block. See ADR-0021.
 *
 * `first` drops the rule for whichever item opens the block — the tier-2 rule above it is
 * already the boundary, and a hairline under it would read as a double line.
 */
function Quiet({ children, first = false }: { children: React.ReactNode; first?: boolean }) {
  if (first) return <View>{children}</View>;
  return <View className="mt-7 border-t border-white/[.07] pt-6">{children}</View>;
}

type HomeScreenProps = {
  selectedArea: string | null;
  onSelectArea: (areaKey: string) => void;
  onOpenArchive: () => void;
  onOpenProfile: () => void;
  /** Opens the focus drawer. The `+` in the hero is the only visible way in. */
  onAddFocus: () => void;
  onStartPractice: (issue: Issue) => Promise<void> | void;
  onOpenHistory: (issue: Issue) => void;
};

/**
 * Home: a photograph, the parts of the game, and what the golfer has open in the one they
 * picked. Starting a session is the one thing that wins; everything below it recedes.
 *
 * The layout, its three separation tiers, and why an empty area shows nothing else are in
 * ADR-0021.
 */
export default function HomeScreen({
  selectedArea,
  onSelectArea,
  onOpenArchive,
  onOpenProfile,
  onAddFocus,
  onStartPractice,
  onOpenHistory,
}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const {
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
    hasAnything,
    firstLoad,
    activityError,
    counts,
    refetchActivity,
    refetchIssues,
    refetchPrograms,
  } = useHomeData(selectedArea, user?.name);

  // Lazy initialiser, so the image is picked once per mount rather than re-rolled per render.
  const [heroImage] = useState(() => pickHeroImage());

  const [startingId, setStartingId] = useState<string | null>(null);

  const [infoIssue, setInfoIssue] = useState<Issue | null>(null);

  const showSecondary = hasAnything && areaPrograms.length > 0;

  const handleStart = useCallback(
    async (issue: Issue) => {
      if (startingId) return; // double-submit guard
      setStartingId(issue.id ?? null);
      try {
        await onStartPractice(issue);
      } finally {
        setStartingId(null);
      }
    },
    [onStartPractice, startingId]
  );

  const handleStartProgram = useCallback(
    (issueId: string | null) => {
      const issue = issues.find((i) => i.id === issueId);
      if (!issue) {
        Alert.alert('Not in your plan', "This focus isn't available anymore.");
        return;
      }
      handleStart(issue);
    },
    [issues, handleStart]
  );

  const handleRemoveIssue = useCallback(() => {
    const issue = infoIssue;
    if (!issue?.id) return;
    Alert.alert('Remove this issue?', "It'll disappear from your plan.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            // An analysis-diagnosed issue is dismissed through its
            // analysis link; a browse or coach focus is removed by
            // deleting the program (or the custom issue itself).
            if (issue.analysis_issue_id) {
              await analysisService.dismissAnalysisIssue(issue.analysis_issue_id);
            } else {
              await removeFocus(issue.id!);
            }
            setInfoIssue(null);
            refetchIssues();
            refetchPrograms();
          } catch (err) {
            console.error('Failed to remove issue:', err);
            Alert.alert("Couldn't remove that", 'Please try again.');
          }
        },
      },
    ]);
  }, [infoIssue, refetchIssues, refetchPrograms]);

  if (firstLoad && !activityError) {
    return <LoadingState title="Loading your week" subtitle="" />;
  }

  if (activityError && counts.length === 0 && programs.length === 0) {
    const offline = activityError.includes('connect');
    return (
      <ErrorState
        title={offline ? 'No connection' : "Couldn't load your home"}
        message={
          offline
            ? 'Check your internet connection and try again.'
            : 'Something went wrong loading your week.'
        }
        onRetry={refetchActivity}
      />
    );
  }

  return (
    <View className="flex-1 bg-ink">
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <HomeHero
          image={heroImage}
          title={greeting.title}
          subtitle={greeting.subtitle}
          photoURL={user?.photoURL}
          name={user?.name}
          email={user?.email}
          onOpenProfile={onOpenProfile}
          onAddFocus={onAddFocus}
        />

        <View className="px-6">
          {areas.length > 0 ? (
            <AreaTabs
              areas={areas}
              selectedKey={resolvedArea}
              countByArea={countByArea}
              onSelect={onSelectArea}
            />
          ) : null}

          <View className="pt-8">
            <HomeAreaBody
              hasAnything={hasAnything}
              area={areaTerm}
              programs={areaPrograms}
              hasStartable={startable.length > 0}
              startingIssueId={startingId}
              onStartProgram={handleStartProgram}
              onOpenInfo={(issueId) => setInfoIssue(issues.find((i) => i.id === issueId) ?? null)}
              onBrowse={(areaKey) =>
                router.push(areaKey ? `/add-focus/browse?area=${areaKey}` : '/add-focus/browse')
              }
            />
          </View>

          {/* The screen's one tier-2 rule sits here, and nothing renders below the
              invitation when an area is bare. See ADR-0021. */}
          {startable.length > 0 || showSecondary ? (
            <Section>
              {startable.length > 0 ? (
                <StartableList issues={startable} startingId={startingId} onStart={handleStart} />
              ) : null}

              {showSecondary ? (
                <>
                  <Quiet first={startable.length === 0}>
                    <StreakPanel streakDays={stats.streakDays} month={stats.month} />
                  </Quiet>

                  <Quiet>
                    <ArchiveEntry onPress={onOpenArchive} />
                  </Quiet>
                </>
              ) : null}
            </Section>
          ) : null}
        </View>
      </ScrollView>

      <IssueInfoModal
        visible={infoIssue !== null}
        issue={infoIssue}
        onClose={() => setInfoIssue(null)}
        onRemove={handleRemoveIssue}
        onOpenHistory={() => {
          const issue = infoIssue;
          setInfoIssue(null);
          if (issue) onOpenHistory(issue);
        }}
      />

    </View>
  );
}
