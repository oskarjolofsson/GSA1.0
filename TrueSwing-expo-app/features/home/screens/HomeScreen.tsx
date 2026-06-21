import React, { useCallback, useMemo, useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";

import StreakPanel from "features/home/components/StreakPanel";
import PrescriptionCard from "features/home/components/PrescriptionCard";
import ArchiveEntry from "features/home/components/ArchiveEntry";
import HomeWelcome from "features/home/components/HomeWelcome";
import DayDetailModal from "features/home/components/DayDetailModal";
import Avatar from "features/shared/components/Avatar";
import LoadingState from "features/shared/components/LoadingState";
import ErrorState from "features/shared/components/ErrorState";
import { useAuth } from "features/auth/AuthProvider";
import { useHomeAnalysis } from "features/home/context/HomeAnalysisContext";
import useActivity from "features/home/hooks/useActivity";
import { deriveActivityStats } from "features/home/utils/activityStats";

type HomeScreenProps = {
    onOpenArchive: () => void;
    onOpenProfile: () => void;
    onStartPrescription?: () => void;
};

// Single-screen, no scroll. Two depth layers:
//   FIELD (flat deep navy)  -> streak + week strip (live, from /activity)
//   CARD  (raised surface)  -> prescription + start button + "Your swings"
// A user with no activity yet gets the full-screen HomeWelcome instead.
export default function HomeScreen({
    onOpenArchive,
    onOpenProfile,
    onStartPrescription,
}: HomeScreenProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const { counts, loading, error, refetch } = useActivity();
    const { allAnalyses, setActiveAnalysisIndex } = useHomeAnalysis();

    // The day whose detail popup is open, or null when closed. `hasActivity`
    // lets the modal skip the network call for an empty day.
    const [selectedDay, setSelectedDay] = useState<{ date: string; hasActivity: boolean } | null>(
        null
    );

    // Refresh activity whenever the home tab regains focus.
    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch])
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
                <Image
                    source={require("../../../assets/true_swing_logo2.png")}
                    style={{ width: 130, height: 45, marginTop: 10 }}
                    // resizeMode="contain"
                    accessibilityRole="image"
                    accessibilityLabel="TrueSwing"
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

            {/* Raised action card — full-bleed sheet, flush to the bottom edge. */}
            <View
                className="rounded-t-3xl border border-white/10 border-b-0 bg-ink-raised px-5 pt-5"
                style={{
                    paddingBottom: insets.bottom + 20,
                    shadowColor: "#000",
                    shadowOpacity: 0.45,
                    shadowRadius: 28,
                    shadowOffset: { width: 0, height: 16 },
                    elevation: 16,
                }}
            >
                <PrescriptionCard onStart={onStartPrescription} />

                <View className="my-4 h-px bg-sand/10" />

                <ArchiveEntry onPress={onOpenArchive} />
            </View>

            <DayDetailModal
                date={selectedDay?.date ?? null}
                hasActivity={selectedDay?.hasActivity ?? false}
                onClose={() => setSelectedDay(null)}
                onOpenAnalysis={handleOpenAnalysis}
            />
        </View>
    );
}