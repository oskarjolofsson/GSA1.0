import React, { useCallback, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS, useReducedMotion } from "react-native-reanimated";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import type { Issue } from "features/issues/types";
import { HOME_ANIM } from "features/home/animations";

type PrescriptionCardProps = {
    issue: Issue | null;
    index: number; // position of `issue` in the user's list
    total: number; // number of issues (for the switcher indicator)
    loading: boolean;
    onPrev: () => void;
    onNext: () => void;
    onStart: () => void;
};

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
    onPrev,
    onNext,
    onStart,
}: PrescriptionCardProps) {
    const reduceMotion = useReducedMotion();
    const canSwitch = total > 1;
    // Can't start a session without an analysis_issue_id (mirrors the reel guard).
    const canStart = !!issue?.analysis_issue_id && !loading;

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
        onStart();
    }, [onStart]);

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

            {/* Swipeable issue text. Keyed by issue id so each switch slides in. */}
            <GestureDetector gesture={pan}>
                <MotiView
                    key={issue?.id ?? "none"}
                    from={slideFrom}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ type: "timing", duration: reduceMotion ? 0 : 220 }}
                >
                    <Text className="mt-2 font-display-bold text-[32px] leading-tight text-sand">
                        {loading ? "…" : issue?.title ?? "No issue yet"}
                    </Text>

                    <Text className="mt-2 font-sans text-[15px] leading-snug text-sand-dim">
                        {issue
                            ? "Run today's drill to keep working it."
                            : "Make a swing analysis to get today's drill."}
                    </Text>
                </MotiView>
            </GestureDetector>

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
                            Start today&apos;s drill
                        </Text>
                        <ArrowRight size={18} color="#0A0F1A" strokeWidth={2.5} />
                    </LinearGradient>
                </MotiView>
            </Pressable>
        </View>
    );
}
