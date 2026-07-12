import React, { useCallback, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight, ChevronLeft, ChevronRight, Info, MoreHorizontal, Trash2 } from "lucide-react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS, useReducedMotion } from "react-native-reanimated";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import type { Issue } from "features/issues/types";
import { HOME_ANIM } from "features/home/animations";
import type { Program, ProgramStep } from "features/programs/types";

type PrescriptionCardProps = {
    issue: Issue | null;
    index: number; // position of `issue` in the user's list
    total: number; // number of issues (for the switcher indicator)
    loading: boolean;
    program: Program | null;
    nextStep: ProgramStep | null;
    onPrev: () => void;
    onNext: () => void;
    onStart: () => void;
    onPlay: () => void;
    onRetest: () => void;
    onOpenHistory: () => void;
    onShowInfo: () => void;
    onRemove: () => void;
    isFocus: boolean;
    hasActiveProgram: boolean;
};

// Derives the card's session line, detail, button label, and whether Start is
// enabled from the program state. Range is startable this phase; play/retest are
// shown but gated ("Coming soon") until Phases 4/5.
function deriveCardState(
    issue: Issue | null,
    program: Program | null,
    nextStep: ProgramStep | null,
    loading: boolean,
    isFocus: boolean,
    hasActiveProgram: boolean
) {
    // Any issue (AI, coach, or browse) is practiceable now — key on its id, not on
    // whether it came from an analysis.
    const hasIssue = !!issue?.id;
    const base = { sessionLine: null as string | null, detail: null as string | null, buttonLabel: "Start session", startable: hasIssue && !loading, hideButton: false };

    if (!hasIssue) {
        return { ...base, detail: "Make a swing analysis to get today's plan.", buttonLabel: "Start today's drill", startable: false };
    }
    // Focus model: one program at a time.
    if (issue?.program_status === "completed") {
        return { ...base, detail: "You've grooved this issue. Nice work.", buttonLabel: "Completed", startable: false, hideButton: true };
    }
    if (!program) {
        // Not started: the focus (queue head) can start; everything else queues
        // behind the current focus.
        if (isFocus && !hasActiveProgram) {
            return { ...base, detail: "Start a focused plan for this issue.", buttonLabel: "Start your plan" };
        }
        return { ...base, detail: "Queued — finish your current focus first.", buttonLabel: "Queued", startable: false };
    }

    const p = nextStep?.prescription;
    switch (nextStep?.session_type) {
        case "range": {
            const names = (nextStep?.drills ?? []).map((d) => d.title);
            const n = p?.num_blocks ?? p?.drill_ids?.length ?? names.length;
            const sessionLine = names.length ? names.join(" + ") : `Range · ${n} drill${n === 1 ? "" : "s"}`;
            return { ...base, sessionLine, detail: p?.cue ?? "Hit a focused block on each drill.", buttonLabel: "Start session" };
        }
        case "play":
            return { ...base, sessionLine: `Play ${p?.holes ?? 9} holes`, detail: p?.focus ?? null, buttonLabel: "Log round", startable: hasIssue && !loading };
        case "retest":
            return { ...base, sessionLine: "Re-test your swing", detail: p?.instruction ?? null, buttonLabel: "Re-test", startable: hasIssue && !loading };
        default:
            return { ...base, detail: "Your plan is up to date.", buttonLabel: "Start session" };
    }
}

function tapHaptic() {
    Haptics.selectionAsync().catch(() => {});
}

function impactHaptic() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export default function PrescriptionCard({
    issue,
    index,
    total,
    loading,
    program,
    nextStep,
    onPrev,
    onNext,
    onStart,
    onPlay,
    onRetest,
    onOpenHistory,
    onShowInfo,
    onRemove,
    isFocus,
    hasActiveProgram,
}: PrescriptionCardProps) {
    const reduceMotion = useReducedMotion();
    const canSwitch = total > 1;

    const { sessionLine, detail, buttonLabel, startable, hideButton } = deriveCardState(issue, program, nextStep, loading, isFocus, hasActiveProgram);
    const canStart = startable;
    const progressLine = program
        ? `${program.grooved_count} of ${program.total_drills} drills grooved`
        : null;

    // Direction of the last switch: +1 = next (slide in from right), -1 = prev.
    const [dir, setDir] = useState(1);
    const [pressed, setPressed] = useState(false);

    const goNext = useCallback(() => {
        if (!canSwitch) return;
        setDir(1);
        tapHaptic();
        onNext();
    }, [canSwitch, onNext]);

    const goPrev = useCallback(() => {
        if (!canSwitch) return;
        setDir(-1);
        tapHaptic();
        onPrev();
    }, [canSwitch, onPrev]);

    const handleStart = useCallback(() => {
        impactHaptic();
        if (nextStep?.session_type === "play") onPlay();
        else if (nextStep?.session_type === "retest") onRetest();
        else onStart();
    }, [nextStep?.session_type, onPlay, onRetest, onStart]);

    // Horizontal swipe over the issue text cycles issues. activeOffsetX keeps
    // small/vertical movement as taps so it never steals the chevrons.
    const pan = Gesture.Pan()
        .activeOffsetX([-15, 15])
        .onEnd((e) => {
            "worklet";
            if (e.translationX <= -HOME_ANIM.swipeThreshold) runOnJS(goNext)();
            else if (e.translationX >= HOME_ANIM.swipeThreshold) runOnJS(goPrev)();
        });

    const slideFrom = reduceMotion
        ? { opacity: 1, translateX: 0 }
        : { opacity: 0, translateX: dir * HOME_ANIM.issueSlide };

    return (
        <View>
            <View className="flex-row items-center justify-between">
                <Text className="font-sans-medium text-xs uppercase tracking-[2px] text-sand-dim">
                    Today&apos;s issue
                </Text>

                {canSwitch && (
                    <View className="flex-row items-center gap-1">
                        <Pressable onPress={goPrev} hitSlop={8} className="p-1 active:opacity-60">
                            <ChevronLeft size={18} color="#8A8676" />
                        </Pressable>
                        <Text className="font-sans-medium text-xs text-sand-dim">
                            {index + 1}/{total}
                        </Text>
                        <Pressable onPress={goNext} hitSlop={8} className="p-1 active:opacity-60">
                            <ChevronRight size={18} color="#8A8676" />
                        </Pressable>
                    </View>
                )}
            </View>

            {loading ? (
                <View className="items-center justify-center py-12">
                    <ActivityIndicator color="#E4C892" />
                    <Text className="mt-3 font-sans text-[13px] text-sand-dim">
                        Loading your plan…
                    </Text>
                </View>
            ) : (
            <>
            {/* Swipeable issue text. Keyed by issue id so each switch slides in. */}
            <GestureDetector gesture={pan}>
                <MotiView
                    key={issue?.id ?? "none"}
                    from={slideFrom}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ type: "timing", duration: reduceMotion ? 0 : 220 }}
                >
                    <View className="mt-2 flex-row items-start gap-2">
                        <Text className="flex-1 font-display-bold text-[32px] leading-tight text-sand">
                            {issue?.title ?? "No issue yet"}
                        </Text>
                        {issue && (
                            <View className="mt-2 flex-row items-center gap-3">
                                <Pressable onPress={onShowInfo} hitSlop={8} className="active:opacity-60">
                                    <Info size={20} color="#8A8676" />
                                </Pressable>
                                <Pressable onPress={onRemove} hitSlop={8} className="active:opacity-60">
                                    <Trash2 size={20} color="#8A8676" />
                                </Pressable>
                            </View>
                        )}
                    </View>

                    {sessionLine && (
                        <View className="mt-3">
                            <Text className="font-sans-medium text-[11px] uppercase tracking-[2px] text-sand-dim">
                                Next session
                            </Text>
                            <Text numberOfLines={2} className="mt-1 font-display-bold text-[20px] leading-tight text-sand">
                                {sessionLine}
                            </Text>
                        </View>
                    )}

                    {detail && (
                        <Text className="mt-2 font-sans text-[15px] leading-snug text-sand-dim">
                            {detail}
                        </Text>
                    )}

                    {progressLine && (
                        <Text className="mt-2 font-sans-medium text-[12px] text-sand-dim">
                            {progressLine}
                        </Text>
                    )}

                    {program && (
                        <Pressable onPress={onOpenHistory} hitSlop={6} className="mt-2 self-start active:opacity-60">
                            <Text className="font-sans-medium text-[12px] text-[#E4C892]">
                                See your swings →
                            </Text>
                        </Pressable>
                    )}
                </MotiView>
            </GestureDetector>

            {!hideButton && (
            <Pressable
                onPress={handleStart}
                onPressIn={() => setPressed(true)}
                onPressOut={() => setPressed(false)}
                disabled={!canStart}
                className="mt-4"
                style={{ opacity: canStart ? 1 : 0.5 }}
            >
                <MotiView
                    animate={{ scale: pressed && !reduceMotion ? HOME_ANIM.pressScale : 1 }}
                    transition={{ type: "timing", duration: 90 }}
                    className="overflow-hidden rounded-2xl"
                    style={{
                        shadowColor: "#E4C892",
                        shadowOpacity: 0.35,
                        shadowRadius: 22,
                        shadowOffset: { width: 0, height: 8 },
                        elevation: 8,
                    }}
                >
                    <LinearGradient
                        colors={["#ECD3A0", "#D2B271"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            width: "100%",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            paddingHorizontal: 20,
                            paddingVertical: 16,
                        }}
                    >
                        <Text numberOfLines={1} className="font-display-bold text-[17px] text-ink">
                            {buttonLabel}
                        </Text>
                        <ArrowRight size={18} color="#0A0F1A" strokeWidth={2.5} />
                    </LinearGradient>
                </MotiView>
            </Pressable>
            )}
            </>
            )}
        </View>
    );
}
