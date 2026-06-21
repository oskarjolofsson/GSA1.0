import React from "react";
import { ScrollView, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ContributionGraph from "features/home/components/ContributionGraph";
import PrescriptionCard from "features/home/components/PrescriptionCard";
import ArchiveEntry from "features/home/components/ArchiveEntry";

type HomeScreenProps = {
    onOpenArchive: () => void;
    onStartPrescription?: () => void;
};

// MVP layout only: three stacked sections with static placeholder data.
//   TOP    -> ContributionGraph + streak
//   MIDDLE -> PrescriptionCard ("Today -> [issue]")
//   BELOW  -> ArchiveEntry (opens the reel)
export default function HomeScreen({ onOpenArchive, onStartPrescription }: HomeScreenProps) {
    const insets = useSafeAreaInsets();

    return (
        <ScrollView
            className="flex-1 bg-[#0b1220]"
            contentContainerStyle={{
                paddingTop: insets.top + 16,
                paddingBottom: 24,
                paddingHorizontal: 16,
                gap: 16,
            }}
        >
            <Text className="text-3xl font-bold text-white">Home</Text>

            <ContributionGraph />
            <PrescriptionCard onStart={onStartPrescription} />
            <ArchiveEntry onPress={onOpenArchive} />
        </ScrollView>
    );
}
