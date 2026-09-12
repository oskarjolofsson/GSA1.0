import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import IntroHeader from "../components/IntroHeader";
import IntroButton from "../components/IntroButton";
import IntroFocusList from "../components/IntroFocusList";
import type { IntroArea, IntroIssue } from "../services/introCatalogService";

type Props = {
    area: IntroArea;
    kind: IntroIssue["kind"];
    issues: IntroIssue[];
    selectedId: string | null;
    onSelect: (issue: IntroIssue) => void;
    /** Saving the pick to the device, before handing off to sign-up. */
    saving: boolean;
    saveError: string | null;
    onContinue: () => void;
    onBack: () => void;
    onSkip: () => void;
};

/** Step two: one focus point inside the chosen area.
 *
 *  One, not several. A golfer with no account has no way to judge how much
 *  practice they are signing up for, and a plan that starts with a single focus
 *  is the one this product argues for anyway — the home screen caps open focuses
 *  per area for the same reason. */
export default function IntroFocusScreen({
    area,
    kind,
    issues,
    selectedId,
    onSelect,
    saving,
    saveError,
    onContinue,
    onBack,
    onSkip,
}: Props) {
    const insets = useSafeAreaInsets();

    return (
        <View className="flex-1" style={{ paddingTop: insets.top }}>
            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 }}
            >
                <IntroHeader
                    eyebrow={area.golfer_label}
                    heading={kind === "skill" ? "What do you\nwant to work on?" : "What do you\nwant to fix?"}
                    onBack={onBack}
                />

                <Text className="mt-4 text-[14px] leading-[21px] text-sand-dim">
                    Pick one to start with. You can add more once you&apos;re in.
                </Text>

                <IntroFocusList issues={issues} selectedId={selectedId} onSelect={onSelect} />

                {saveError ? (
                    <Text className="mt-6 text-[13px] leading-[19px] text-danger">{saveError}</Text>
                ) : null}
            </ScrollView>

            <View className="px-5" style={{ paddingBottom: insets.bottom + 12 }}>
                <IntroButton
                    label="Create your account"
                    onPress={onContinue}
                    disabled={!selectedId}
                    busy={saving}
                />
                <View className="mt-3">
                    <IntroButton label="Skip for now" onPress={onSkip} tone="quiet" />
                </View>
            </View>
        </View>
    );
}
