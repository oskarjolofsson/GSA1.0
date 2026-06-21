import React from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import StreakPanel from "features/home/components/StreakPanel";
import PrescriptionCard from "features/home/components/PrescriptionCard";
import ArchiveEntry from "features/home/components/ArchiveEntry";
import Avatar from "features/shared/components/Avatar";
import { useAuth } from "features/auth/AuthProvider";

type HomeScreenProps = {
    onOpenArchive: () => void;
    onOpenProfile: () => void;
    onStartPrescription?: () => void;
};

// Single-screen, no scroll. Two depth layers:
//   FIELD (flat deep navy)  -> streak + week strip
//   CARD  (raised surface)  -> prescription + start button + "Your swings"
// Vertical rhythm is limited to the 8 / 16 / 24 / 32 scale.
// MVP layout only; all data is static placeholder.
export default function HomeScreen({
    onOpenArchive,
    onOpenProfile,
    onStartPrescription,
}: HomeScreenProps) {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    return (
        <View className="flex-1 bg-ink" style={{ paddingTop: insets.top }}>
            {/* Profile avatar — top-right, opens the profile tab. */}
            <View className="flex-row justify-end px-6 pt-4">
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
                <StreakPanel />

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
        </View>
    );
}