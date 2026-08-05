import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import HomeHero from 'features/home/components/HomeHero';
import AreaTabs from 'features/home/components/AreaTabs';
import HomeAreaBody from 'features/home/components/HomeAreaBody';
import StartableList from 'features/home/components/StartableList';
import LogRoundRow from 'features/home/components/LogRoundRow';
import StreakPanel from 'features/home/components/StreakPanel';
import SessionLogModal from 'features/home/components/SessionLogModal';
import DayDetailModal from 'features/home/components/DayDetailModal';
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

type HomeScreenProps = {
  selectedArea: string | null;
  onSelectArea: (areaKey: string) => void;
  onOpenArchive: () => void;
  onOpenProfile: () => void;
  onStartPractice: (issue: Issue) => Promise<void> | void;
  onLogRound: (notes: string) => Promise<boolean>;
  onOpenHistory: (issue: Issue) => void;
};

/**
 * Home: a photograph, the parts of the game, and what the golfer has open in the
 * one they picked.
 *
 *   hero (360px, full bleed)
 *   area tabs
 *   ── programs, separated by AIR not rules ──
 *   ─────────────── tier-2 rule ──────────────
 *   round row
 *   ─────────────── tier-2 rule ──────────────
 *   could also work on
 *   ─────────────── tier-2 rule ──────────────
 *   streak
 *
 * SEPARATION HAS EXACTLY THREE TIERS. Between two programs: no rule, 34px of air
 * — they are peers of the same kind, and a line would say "different kind of
 * thing", which is false. Between items in a list: a .07 hairline. Between
 * sections: a .13 rule with 36/28px either side, the only heavy mark on the
 * screen, so the page resolves into blocks before a word is read.
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
  onStartPractice,
  onLogRound,
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

  const [selectedDay, setSelectedDay] = useState<{ date: string; hasActivity: boolean } | null>(
    null
  );
  const [logOpen, setLogOpen] = useState(false);
  const [logging, setLogging] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  // The issue whose detail sheet is open. That sheet carries what the old home
  // card's info button, history link and remove action used to.
  const [infoIssue, setInfoIssue] = useState<Issue | null>(null);

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

  const handleConfirmRound = useCallback(
    async (notes: string) => {
      setLogging(true);
      const ok = await onLogRound(notes);
      setLogging(false);
      if (ok) {
        setLogOpen(false);
        refetchActivity();
      }
    },
    [onLogRound, refetchActivity]
  );

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
              onBrowse={() => router.push('/(tabs)/upload')}
            />
          </View>

          <Section>
            <LogRoundRow onPress={() => setLogOpen(true)} />
          </Section>

          {startable.length > 0 ? (
            <Section>
              <StartableList issues={startable} startingId={startingId} onStart={handleStart} />
            </Section>
          ) : null}

          <Section>
            <StreakPanel
              streakDays={stats.streakDays}
              week={stats.week}
              onDayPress={(date, hasActivity) => setSelectedDay({ date, hasActivity })}
            />
            <Text className="mt-3 text-center text-[11px] text-sand/40">
              Each square is a day you practised.
            </Text>
          </Section>

          <Section>
            <ArchiveEntry onPress={onOpenArchive} />
          </Section>
        </View>
      </ScrollView>

      <DayDetailModal
        date={selectedDay?.date ?? null}
        hasActivity={selectedDay?.hasActivity ?? false}
        onClose={() => setSelectedDay(null)}
        onOpenAnalysis={() => {
          setSelectedDay(null);
          onOpenArchive();
        }}
      />

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

      <SessionLogModal
        visible={logOpen}
        title="Log your round"
        body="Nine or eighteen — whatever you played counts."
        showNotes
        confirmLabel="I played it"
        submitting={logging}
        onConfirm={handleConfirmRound}
        onClose={() => setLogOpen(false)}
      />
    </View>
  );
}
