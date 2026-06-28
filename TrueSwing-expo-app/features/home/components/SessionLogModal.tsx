import { useEffect, useState } from "react";
import {
    Modal,
    View,
    Text,
    Pressable,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

type SessionLogModalProps = {
    visible: boolean;
    title: string;
    body: string | null;
    showNotes: boolean;
    confirmLabel: string;
    submitting: boolean;
    onConfirm: (notes: string) => void;
    onClose: () => void;
};

// Confirm sheet for logging a program session that has no in-app activity (an
// on-course round, or a re-test). Resurfaces the focus/instruction and optionally
// captures notes. A native Modal renders in its own window — keep home-screen
// animations out from behind it.
export default function SessionLogModal({
    visible,
    title,
    body,
    showNotes,
    confirmLabel,
    submitting,
    onConfirm,
    onClose,
}: SessionLogModalProps) {
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (visible) setNotes("");
    }, [visible]);

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
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
                    <SafeAreaView edges={["bottom"]} className="rounded-t-3xl border border-b-0 border-white/10 bg-ink-raised">
                        <View className="px-6 pt-6">
                            <Text className="font-sans-medium text-[11px] uppercase tracking-[2px] text-sand-dim">
                                {title}
                            </Text>

                            {body ? (
                                <Text className="mt-2 font-display-bold text-[22px] leading-tight text-sand">
                                    {body}
                                </Text>
                            ) : null}

                            {showNotes && (
                                <>
                                    <Text className="mt-4 font-sans-medium text-[11px] uppercase tracking-[2px] text-sand-dim">
                                        Notes (optional)
                                    </Text>
                                    <TextInput
                                        value={notes}
                                        onChangeText={setNotes}
                                        editable={!submitting}
                                        multiline
                                        placeholder="How did it go? Anything you noticed…"
                                        placeholderTextColor="#8A8676"
                                        className="mt-2 min-h-[88px] rounded-2xl border border-white/10 bg-ink px-4 py-3 font-sans text-[15px] text-sand"
                                        textAlignVertical="top"
                                    />
                                </>
                            )}

                            <Pressable
                                onPress={() => onConfirm(notes.trim())}
                                disabled={submitting}
                                className="mt-5 overflow-hidden rounded-2xl"
                                style={{ opacity: submitting ? 0.6 : 1 }}
                            >
                                <LinearGradient
                                    colors={["#ECD3A0", "#D2B271"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 8,
                                        paddingVertical: 16,
                                    }}
                                >
                                    {submitting && <ActivityIndicator size="small" color="#0A0F1A" />}
                                    <Text className="font-display-bold text-[17px] text-ink">
                                        {submitting ? "Saving…" : confirmLabel}
                                    </Text>
                                </LinearGradient>
                            </Pressable>

                            <Pressable
                                onPress={onClose}
                                disabled={submitting}
                                className="mt-3 items-center py-3 active:opacity-70"
                            >
                                <Text className="font-sans-medium text-[15px] text-sand-dim">Not yet</Text>
                            </Pressable>
                        </View>
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}
