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

/** A tier-2 boundary: the .13 rule with real air either side. The only heavy
 *  mark on the screen, which is what makes the page resolve into blocks before
 *  a word is read. */
function Section({ children }: { children: React.ReactNode }) {
  return <View className="mt-9 border-t border-white/[.13] pt-7">{children}</View>;
}

/**
 * A separator between peers inside the secondary block.
 *
 * Home used to give four sections their own tier-2 rule, which handed each of
 * them the same claim on attention as the one thing the golfer came to do. Now a
 * single tier-2 rule marks where the primary block ends, and everything after it
 * separates with .07 hairlines and tighter air: "still here, not the point".
 *
 * `first` drops the rule for whichever item opens the block — the tier-2 rule
 * above it is already the boundary, and a hairline immediately under it would
 * read as a double line.
 *
 * DIMMING IS DONE WITH THE TOKEN, NOT AN OPACITY LAYER. A first pass wrapped
 * these in ~60% opacity and they read as disabled rather than secondary — a
 * golfer should still be able to use them, just not be pulled toward them. The
 * components inside carry `text-sand-dim` themselves.
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
 * Home: a photograph, the parts of the game, and what the golfer has open in the
 * one they picked.
 *
 *   hero (360px, full bleed)
 *   area tabs
 *   ── programs, separated by AIR not rules ──
 *   each ending in a gold "Start practice" button
 *   ─────────── the ONE tier-2 rule ───────────
 *   could also work on          ┐
 *   ┈┈┈┈┈┈┈┈ hairline ┈┈┈┈┈┈┈┈  │ everything here is
 *   streak                      │ secondary: sand-dim,
 *   ┈┈┈┈┈┈┈┈ hairline ┈┈┈┈┈┈┈┈  │ hairlines, no gold
 *   your swings                 ┘
 *
 * ONE THING WINS, AND IT IS STARTING A SESSION. A usability test (2026-08-09)
 * found a golfer who picked an area fine and then could not work out how to
 * practise: the action was 13px underlined text, the smallest type on a screen
 * whose largest was a 48px streak count, and all three of the screen's permitted
 * gold appearances sat on a "Played a round?" row. The hierarchy was inverted and
 * she read it correctly. Everything below the Start button now recedes.
 *
 * SEPARATION HAS EXACTLY THREE TIERS. Between two programs: no rule, 34px of air
 * — they are peers of the same kind, and a line would say "different kind of
 * thing", which is false. Between items in the secondary block: a .07 hairline.
 * Between the primary block and that secondary one: a single .13 rule. It is used
 * ONCE, where the boundary is real; four of them gave four sections the same claim
 * on attention as the one thing the golfer came to do.
 *
 * AN AREA WITH NOTHING OPEN SHOWS NOTHING ELSE. No suggestions, no streak, no
 * archive — see `showSecondary` below and `AreaEmptyCard`.
 *
 * NO OVERSCROLL. The hero runs full bleed to the top of the screen, so an iOS
 * rubber-band would drag ink in above the photograph and pull the greeting off
 * its composition.
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

  // Picked once per mount: stable while the golfer is here, different when they
  // come back. Lazy initialiser so it is not re-rolled on every render.
  const [heroImage] = useState(() => pickHeroImage());

  const [startingId, setStartingId] = useState<string | null>(null);

  // The issue whose detail sheet is open. That sheet carries what the old home
  // card's info button, history link and remove action used to.
  const [infoIssue, setInfoIssue] = useState<Issue | null>(null);

  // Streak and archive only appear once the golfer has something going in this
  // area. See the render below — a bare area gets the invitation and nothing else.
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

          {/* ONE TIER-2 RULE ON THE SCREEN, AND IT SITS HERE: the boundary between
              what the golfer came to do and everything else. That is exactly the
              job DESIGN.md gives the .13 rule ("different kind of thing starts
              here"). Inside the block below, items are peers of one kind, so they
              separate with .07 hairlines instead.

              NOTHING BELOW THE INVITATION WHEN AN AREA IS BARE. A golfer with
              nothing going in this part of the game gets one instruction and one
              control; a streak and an archive underneath would be two more things
              to read that cannot help them yet. */}
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
