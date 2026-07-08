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
import type { LogSessionArgs, SkipStepArgs } from "features/home/homeFlow";
import { setRetestIntent } from "features/programs/retestIntent";
import analysisService from "features/analysis/services/analysisService";

type HomeScreenProps = {
    onOpenArchive: () => void;
    onOpenProfile: () => void;
    onStartPractice: (issue: Issue) => void;
    onLogSession: (args: LogSessionArgs) => Promise<boolean>;
    onSkipStep: (args: SkipStepArgs) => Promise<boolean>;
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
    onSkipStep,
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

    // Session-log modal (play round or re-test confirm). null when closed.
    const [sessionMode, setSessionMode] = useState<"play" | "retest" | null>(null);
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
            if (!selectedIssue?.id || !program || !nextStep || !sessionMode) return;

            // Re-test for an AI issue: don't credit on tap. Record the intent and
            // send the player to the camera; it completes only when an upload
            // finishes. A CUSTOM issue has no analysis to re-run, so its retest is a
            // self-compare — logged like a play session below (no upload).
            if (sessionMode === "retest" && selectedIssue.analysis_issue_id) {
                setRetestIntent({
                    analysisIssueId: selectedIssue.analysis_issue_id,
                    programId: program.id,
                    stepId: nextStep.id,
                });
                setSessionMode(null);
                router.push("/(tabs)/upload");
                return;
            }

            // Play (or custom self-compare retest): log + advance now (no upload).
            setLogging(true);
            const ok = await onLogSession({
                analysisIssueId: selectedIssue.analysis_issue_id ?? null,
                programId: program.id,
                stepId: nextStep.id,
                sessionType: sessionMode,
                notes,
            });
            setLogging(false);
            if (ok) {
                setSessionMode(null);
                refetchProgram();
            }
        },
        [selectedIssue, program, nextStep, sessionMode, onLogSession, refetchProgram, router]
    );

    const handleSkipRetest = useCallback(() => {
        if (!program || !nextStep) return;
        Alert.alert(
            "Skip this re-test?",
            "Your plan moves on, but you won't earn a square for it.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Skip",
                    style: "destructive",
                    onPress: async () => {
                        const ok = await onSkipStep({ programId: program.id, stepId: nextStep.id });
                        if (ok) {
                            setSessionMode(null);
                            refetchProgram();
                        }
                    },
                },
            ]
        );
    }, [program, nextStep, onSkipStep, refetchProgram]);

    const handleRemoveIssue = useCallback(() => {
        const analysisIssueId = selectedIssue?.analysis_issue_id;
        if (!analysisIssueId) return;
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
                            await analysisService.dismissAnalysisIssue(analysisIssueId);
                            setInfoOpen(false);
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

    // First load with nothing cached yet.
    if (loading && !hasData && !error) {
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

    // Genuinely no activity ever -> first-run welcome.
    if (!stats.hasActivity) {
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
                    onPlay={() => setSessionMode("play")}
                    onRetest={() => setSessionMode("retest")}
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
                visible={sessionMode !== null}
                title={sessionMode === "retest" ? "Re-test your swing" : "Log your round"}
                body={
                    sessionMode === "retest"
                        ? nextStep?.prescription.instruction ?? "Film a fresh swing so you can compare it to where you started."
                        : nextStep?.prescription.focus ?? null
                }
                showNotes={sessionMode === "play"}
                confirmLabel={sessionMode === "retest" ? "Film now" : "I played it"}
                submitting={logging}
                onConfirm={handleConfirmSession}
                onClose={() => setSessionMode(null)}
                onSkip={sessionMode === "retest" ? handleSkipRetest : undefined}
                skipLabel="Skip this re-test"
            />
        </View>
    );
}