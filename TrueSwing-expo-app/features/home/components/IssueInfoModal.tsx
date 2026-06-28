import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Issue } from "features/issues/types";

type IssueInfoModalProps = {
    visible: boolean;
    issue: Issue | null;
    onClose: () => void;
};

function Section({ label, value }: { label: string; value: string | null | undefined }) {
    if (!value) return null;
    return (
        <View className="mt-4">
            <Text className="font-sans-medium text-[11px] uppercase tracking-[2px] text-sand-dim">
                {label}
            </Text>
            <Text className="mt-1 font-sans text-[15px] leading-snug text-sand">{value}</Text>
        </View>
    );
}

// Read-only bottom sheet explaining an issue's jargon title (e.g. "Chicken wing"),
// opened from the info button on the home card. Static content — a native Modal
// is fine here.
export default function IssueInfoModal({ visible, issue, onClose }: IssueInfoModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            presentationStyle="overFullScreen"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View className="flex-1 justify-end bg-black/60">
                <SafeAreaView edges={["bottom"]} className="max-h-[80%] rounded-t-3xl border border-b-0 border-white/10 bg-ink-raised">
                    <ScrollView contentContainerStyle={{ padding: 24 }}>
                        <Text className="font-sans-medium text-[11px] uppercase tracking-[2px] text-sand-dim">
                            About this issue
                        </Text>
                        <Text className="mt-2 font-display-bold text-[26px] leading-tight text-sand">
                            {issue?.title ?? "Issue"}
                        </Text>

                        {issue?.description ? (
                            <Text className="mt-3 font-sans text-[15px] leading-snug text-sand">
                                {issue.description}
                            </Text>
                        ) : null}

                        <Section label="What's happening" value={issue?.current_motion} />
                        <Section label="What it should be" value={issue?.expected_motion} />
                        <Section label="Why it matters" value={issue?.swing_effect} />
                        <Section label="Typical miss" value={issue?.shot_outcome} />

                        <Pressable
                            onPress={onClose}
                            className="mt-6 items-center rounded-2xl border border-white/10 bg-white/5 py-4 active:bg-white/10"
                        >
                            <Text className="font-sans-medium text-[15px] text-sand">Close</Text>
                        </Pressable>
                    </ScrollView>
                </SafeAreaView>
            </View>
        </Modal>
    );
}
