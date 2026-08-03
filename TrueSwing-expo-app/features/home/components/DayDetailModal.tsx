import React from "react";
import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Dumbbell, Film, ChevronRight } from "lucide-react-native";

import useDayDetail from "features/home/hooks/useDayDetail";
import type { DaySession, DayAnalysis } from "features/home/services/activityService";

type DayDetailModalProps = {
    // The day to show (YYYY-MM-DD) or null when closed.
    date: string | null;
    // Whether the tapped day had any activity. When false we skip the network
    // call entirely and just show the empty state.
    hasActivity: boolean;
    onClose: () => void;
    onOpenAnalysis: (analysisId: string) => void;
};

// Format YYYY-MM-DD -> "Fri, 19 Jun". Parse as local (not UTC) to avoid a shift.
function formatDayLabel(date: string): string {
    const [y, m, d] = date.split("-").map(Number);
    const local = new Date(y, (m ?? 1) - 1, d ?? 1);
    return local.toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
    });
}

export default function DayDetailModal({
    date,
    hasActivity,
    onClose,
    onOpenAnalysis,
}: DayDetailModalProps) {
    const insets = useSafeAreaInsets();
    // Only fetch when the day actually has activity; empty days skip the API.
    const { detail, loading, error } = useDayDetail(hasActivity ? date : null);

    const isEmpty =
        !hasActivity ||
        (!!detail && detail.sessions.length === 0 && detail.analyses.length === 0);

    return (
        <Modal
            visible={date !== null}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            {/* Scrim — tap outside to dismiss. */}
            <Pressable className="flex-1 justify-end bg-black/60" onPress={onClose}>
                {/* Sheet — stop propagation so taps inside don't dismiss. */}
                <Pressable
                    onPress={() => {}}
                    className="rounded-t-3xl border border-white/10 border-b-0 bg-ink-raised px-5 pt-5"
                    style={{ paddingBottom: insets.bottom + 16, maxHeight: "80%" }}
                >
                    <View className="mb-4 flex-row items-center justify-between">
                        <Text className="font-display-bold text-2xl text-sand">
                            {date ? formatDayLabel(date) : ""}
                        </Text>
                        <Pressable
                            onPress={onClose}
                            hitSlop={8}
                            className="h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-ink active:opacity-70"
                        >
                            <X size={18} color="#8A8676" />
                        </Pressable>
                    </View>

                    {loading && (
                        <View className="items-center py-10">
                            <ActivityIndicator color="#EADFC8" />
                        </View>
                    )}

                    {!loading && error && (
                        <Text className="py-8 text-center font-sans text-sand-dim">
                            Couldn&apos;t load this day. Pull down and try again.
                        </Text>
                    )}

                    {!loading && !error && isEmpty && (
                        <Text className="py-8 text-center font-sans text-sand-dim">
                            No activity this day.
                        </Text>
                    )}

                    {!loading && !error && detail && !isEmpty && (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {detail.sessions.length > 0 && (
                                <Section title="Practice">
                                    {detail.sessions.map((s) => (
                                        <SessionRow key={s.id} session={s} />
                                    ))}
                                </Section>
                            )}

                            {detail.analyses.length > 0 && (
                                <Section title="Analyses">
                                    {detail.analyses.map((a) => (
                                        <AnalysisRow
                                            key={a.id}
                                            analysis={a}
                                            onPress={() => onOpenAnalysis(a.id)}
                                        />
                                    ))}
                                </Section>
                            )}
                        </ScrollView>
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View className="mb-4">
            <Text className="mb-2 font-sans-medium text-xs uppercase tracking-[2px] text-sand-dim">
                {title}
            </Text>
            <View className="gap-2">{children}</View>
        </View>
    );
}

/**
 * How the blocks in a session went, in one clause.
 *
 * This used to read `N good · M bad` from `successful_reps` / `failed_reps`. Neither
 * ever held a rep count: `successful_reps` carried the rough/ok/dialed ordinal, so a
 * session of three dialed blocks displayed as "9 good", and `failed_reps` was always 0
 * — a permanent "0 bad" next to it. Read `feel` and `grade`, which mean what they say.
 *
 * Returns "" when nothing was rated, so the row falls back to just the drill count
 * rather than printing a row of zeroes.
 */
function summariseRuns(runs: DaySession["drill_runs"]): string {
    const dialed = runs.filter((r) => r.grade === "dialed" || r.feel === 3).length;
    const ok = runs.filter((r) => r.grade === "ok" || r.feel === 2).length;
    const rough = runs.filter((r) => r.grade === "rough" || r.feel === 1).length;

    return [
        dialed ? `${dialed} dialed` : null,
        ok ? `${ok} ok` : null,
        rough ? `${rough} rough` : null,
    ]
        .filter(Boolean)
        .join(" · ");
}

function SessionRow({ session }: { session: DaySession }) {
    const drillCount = session.drill_runs.length;
    const summary = summariseRuns(session.drill_runs);

    return (
        <View className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-ink p-4">
            <View className="h-10 w-10 items-center justify-center rounded-full border border-sand/15 bg-white/5">
                <Dumbbell size={18} color="#EADFC8" />
            </View>
            <View className="flex-1">
                <Text className="font-sans-semibold text-base text-sand">
                    Practice session
                </Text>
                <Text className="mt-0.5 font-sans text-sm text-sand-dim">
                    {drillCount} {drillCount === 1 ? "drill" : "drills"}
                    {summary ? ` · ${summary}` : ""}
                </Text>
            </View>
        </View>
    );
}

function AnalysisRow({
    analysis,
    onPress,
}: {
    analysis: DayAnalysis;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-ink p-3 active:opacity-70"
        >
            <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-sand/15 bg-white/5">
                {analysis.thumbnail_url ? (
                    <Image
                        source={{ uri: analysis.thumbnail_url }}
                        className="h-14 w-14"
                        resizeMode="cover"
                    />
                ) : (
                    <Film size={20} color="#EADFC8" />
                )}
            </View>
            <View className="flex-1">
                <Text className="font-sans-semibold text-base text-sand">Swing analysis</Text>
                <Text className="mt-0.5 font-sans text-sm text-sand-dim">View in your swings</Text>
            </View>
            <ChevronRight size={20} color="#8A8676" />
        </Pressable>
    );
}
