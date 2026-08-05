import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { MotiView, MotiImage } from "moti";
import { useReducedMotion } from "react-native-reanimated";
import { HOME_ANIM, CARD_SPRING } from "features/home/animations";

import StreakPanel from "features/home/components/StreakPanel";
import PrescriptionCard from "features/home/components/PrescriptionCard";
import SessionLogModal from "features/home/components/SessionLogModal";
import IssueInfoModal from "features/home/components/IssueInfoModal";
import ArchiveEntry from "features/home/components/ArchiveEntry";
import HomeWelcome from "features/home/components/HomeWelcome";
import DayDetailModal from "features/home/components/DayDetailModal";
import Avatar from "features/shared/components/Avatar";
import LoadingState from "features/shared/components/LoadingState";
import ErrorState from "features/shared/components/ErrorState";
import { useAuth } from "features/auth/AuthProvider";
import { useHomeAnalysis } from "features/home/context/HomeAnalysisContext";
import useActivity from "features/home/hooks/useActivity";
import useTodaysIssue from "features/home/hooks/useTodaysIssue";
import { useProgramForIssue } from "features/programs/hooks/useProgramForIssue";
import { deriveActivityStats } from "features/home/utils/activityStats";
import type { Issue } from "features/issues/types";
import type { LogSessionArgs } from "features/home/homeFlow";
import { removeFocus } from "features/programs/services/programService";
import analysisService from "features/analysis/services/analysisService";

type HomeScreenProps = {
    onOpenArchive: () => void;
    onOpenProfile: () => void;
    onStartPractice: (issue: Issue) => void;
    onLogSession: (args: LogSessionArgs) => Promise<boolean>;
    onOpenHistory: (issue: Issue) => void;
};

// Single-screen, no scroll. Two depth layers:
//   FIELD (flat deep navy)  -> streak + week strip (live, from /activity)
//   CARD  (raised surface)  -> prescription + start button + "Your swings"
// A user with no activity yet gets the full-screen HomeWelcome instead.
export default function HomeScreen({
    onOpenArchive,
    onOpenProfile,
    onStartPractice,
    onLogSession,
    onOpenHistory,
}: HomeScreenProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const reduceMotion = useReducedMotion();
    const { user } = useAuth();
    const { counts, loading, error, refetch } = useActivity();
    const { allAnalyses, setActiveAnalysisIndex } = useHomeAnalysis();
    const {
        issues,
        defaultIssueId,
        loading: issuesLoading,
        refetch: refetchIssues,
    } = useTodaysIssue();

    // The day whose detail popup is open, or null when closed. `hasActivity`
    // lets the modal skip the network call for an empty day.
    const [selectedDay, setSelectedDay] = useState<{ date: string; hasActivity: boolean } | null>(
        null
    );

    // Whether the play-round log modal is open. A round is the only session the
    // golfer logs rather than practises.
    const [logOpen, setLogOpen] = useState(false);
    const [logging, setLogging] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);

    // The issue currently shown on the card. null until resolved -> defaults to
    // the server's choice; the user can then cycle with the switcher.
    const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

    // Refresh activity + issues whenever the home tab regains focus.
    useFocusEffect(
        useCallback(() => {
            refetch();
            refetchIssues();
        }, [refetch, refetchIssues])
    );

    // Once issues load (or change), default the selection to the server choice.
    const resolvedSelectedId =
        selectedIssueId && issues.some((i) => i.id === selectedIssueId)
            ? selectedIssueId
            : defaultIssueId;
    const selectedIndex = Math.max(
        issues.findIndex((i) => i.id === resolvedSelectedId),
        0
    );
    const selectedIssue = issues[selectedIndex] ?? null;

    // The active program (if any) + next scheduled session for the selected issue.
    const {
        program,
        nextStep,
        loading: programLoading,
        refetch: refetchProgram,
    } = useProgramForIssue(selectedIssue?.id);

    // Refresh the program when returning to home (e.g. after a session).
    useFocusEffect(
        useCallback(() => {
            refetchProgram();
        }, [refetchProgram])
    );

    const cycleIssue = useCallback(
        (step: number) => {
            if (issues.length === 0) return;
            const next = (selectedIndex + step + issues.length) % issues.length;
            setSelectedIssueId(issues[next].id);
        },
        [issues, selectedIndex]
    );

    // Tapping an analysis in the day popup: jump the reel to that analysis,
    // close the popup, and open the archive. Falls back to the top if the
    // analysis isn't in the loaded list.
    const handleOpenAnalysis = useCallback(
        (analysisId: string) => {
            const index = allAnalyses.findIndex((a) => a.analysis_id === analysisId);
            if (index >= 0) setActiveAnalysisIndex(index);
            setSelectedDay(null);
            onOpenArchive();
        },
        [allAnalyses, setActiveAnalysisIndex, onOpenArchive]
    );

    const handleConfirmSession = useCallback(
        async (notes: string) => {
            if (!selectedIssue?.id || !program || !nextStep) return;

            // Log + advance now: a round happens away from the app, so there is
            // nothing to upload and the square is earned on confirm.
            setLogging(true);
            const ok = await onLogSession({
                analysisIssueId: selectedIssue.analysis_issue_id ?? null,
                issueId: selectedIssue.id,
                programId: program.id,
                stepId: nextStep.id,
                sessionType: "play",
                notes,
            });
            setLogging(false);
            if (ok) {
                setLogOpen(false);
                refetchProgram();
            }
        },
        [selectedIssue, program, nextStep, onLogSession, refetchProgram]
    );

    const handleRemoveIssue = useCallback(() => {
        if (!selectedIssue) return;
        Alert.alert(
            "Remove this issue?",
            "It'll disappear from your plan.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Analysis-diagnosed issue: dismiss the analysis link.
                            // Browse/coach focus (no analysis): remove program (browse)
                            // or delete the custom issue (coach) via removeFocus.
                            if (selectedIssue.analysis_issue_id) {
                                await analysisService.dismissAnalysisIssue(selectedIssue.analysis_issue_id);
                            } else {
                                await removeFocus(selectedIssue.id);
                            }
                            setInfoOpen(false);
                            setSelectedIssueId(null);
                            refetchIssues();
                            refetchProgram();
                        } catch (err) {
                            console.error("Failed to remove issue:", err);
                        }
                    },
                },
            ]
        );
    }, [selectedIssue, refetchIssues, refetchProgram]);

    const stats = useMemo(() => deriveActivityStats(counts), [counts]);
    const hasData = counts.length > 0;
    // Any active analysis OR program — issues comes from get_issues_by_user_id, which
    // includes analysis-linked, custom, and program-linked (browse) catalog issues.
    const hasFocus = !!defaultIssueId || issues.length > 0;

    // First load: wait for BOTH activity and issues before deciding welcome-vs-home,
    // so we don't flash the welcome for a user who actually has a focus.
    if (((loading && !hasData) || (issuesLoading && issues.length === 0)) && !error) {
        return <LoadingState title="Loading your week" subtitle="" />;
    }

    // Fetch failed and we have nothing to show. Distinct from "no activity yet"
    // so we never tell a returning user to make their first analysis.
    if (error && !hasData) {
        const offline = error.includes("connect");
        return (
            <ErrorState
                title={offline ? "No connection" : "Couldn't load your activity"}
                message={
                    offline
                        ? "Check your internet connection and try again."
                        : "Something went wrong loading your week."
                }
                onRetry={refetch}
            />
        );
    }

    // Genuinely nothing yet: no logged activity AND no active focus -> first-run
    // welcome. A user with a focus (analysis, coach, or browse) skips this.
    if (!stats.hasActivity && !hasFocus) {
        return <HomeWelcome onStart={() => router.push("/(tabs)/upload")} />;
    }

    return (
        <View className="flex-1 bg-ink" style={{ paddingTop: insets.top }}>
            {/* Header: TrueSwing logo (left) + profile avatar (right). */}
            <View className="flex-row items-center justify-between px-6 pt-4">
                <MotiImage
                    source={require("../../../assets/true_swing_logo2.png")}
                    style={{ width: 130, height: 45, marginTop: 10 }}
                    accessibilityRole="image"
                    accessibilityLabel="TrueSwing"
                    from={{ opacity: reduceMotion ? 1 : 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "timing", duration: reduceMotion ? 0 : HOME_ANIM.logoFade }}
                />
                <Pressable
                    onPress={onOpenProfile}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Open profile"
                >
                    <Avatar
                        photoURL={user?.photoURL}
                        name={user?.name}
                        email={user?.email}
                        size={50}
                    />
                </Pressable>
            </View>

            {/* Streak + week strip anchored to the top of the field. */}
            <View className="flex-1 justify-center px-6 gap-2">
                <StreakPanel
                    streakDays={stats.streakDays}
                    week={stats.week}
                    onDayPress={(date, hasActivity) => setSelectedDay({ date, hasActivity })}
                />

                <Text className="text-[8px] text-sand/40 text-center">
                    Each square is a day you practiced. Fill the week, keep the streak alive!
                </Text>
            </View>

            {/* Raised action card — full-bleed sheet, slides up on open. */}
            <MotiView
                className="rounded-t-3xl border border-white/10 border-b-0 bg-ink-raised px-5 pt-5"
                from={{ opacity: reduceMotion ? 1 : 0, translateY: reduceMotion ? 0 : 28 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ ...CARD_SPRING, delay: reduceMotion ? 0 : HOME_ANIM.cardDelay }}
                style={{
                    paddingBottom: insets.bottom + 20,
                    shadowColor: "#000",
                    shadowOpacity: 0.45,
                    shadowRadius: 28,
                    shadowOffset: { width: 0, height: 16 },
                    elevation: 16,
                }}
            >
                <PrescriptionCard
                    issue={selectedIssue}
                    index={selectedIndex}
                    total={issues.length}
                    loading={issuesLoading || programLoading}
                    program={program}
                    nextStep={nextStep}
                    onPrev={() => cycleIssue(-1)}
                    onNext={() => cycleIssue(1)}
                    onStart={() => selectedIssue && onStartPractice(selectedIssue)}
                    onPlay={() => setLogOpen(true)}
                    onOpenHistory={() => selectedIssue && onOpenHistory(selectedIssue)}
                    onShowInfo={() => setInfoOpen(true)}
                    onRemove={handleRemoveIssue}
                    isFocus={!!selectedIssue && selectedIssue.id === defaultIssueId}
                    hasActiveProgram={issues.some((i) => i.program_status === "active")}
                />

                <View className="my-4 h-px bg-sand/10" />

                <ArchiveEntry onPress={onOpenArchive} />
            </MotiView>

            <DayDetailModal
                date={selectedDay?.date ?? null}
                hasActivity={selectedDay?.hasActivity ?? false}
                onClose={() => setSelectedDay(null)}
                onOpenAnalysis={handleOpenAnalysis}
            />

            <IssueInfoModal
                visible={infoOpen}
                issue={selectedIssue}
                onClose={() => setInfoOpen(false)}
                onRemove={handleRemoveIssue}
            />

            <SessionLogModal
                visible={logOpen}
                title="Log your round"
                body={nextStep?.prescription.focus ?? null}
                showNotes
                confirmLabel="I played it"
                submitting={logging}
                onConfirm={handleConfirmSession}
                onClose={() => setLogOpen(false)}
            />
        </View>
    );
}