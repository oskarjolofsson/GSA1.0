import {
    View, Text, TextInput, Pressable, ScrollView,
    KeyboardAvoidingView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ImagePlus, X } from "lucide-react-native";

import ErrorState from "features/shared/components/ErrorState";
import type { useCoachFeedback } from "../useCoachFeedback";

type Props = {
    cf: ReturnType<typeof useCoachFeedback>;
    onBack: () => void;
};

/** Paste the coach's lesson notes (and optionally a photo of them). */
export default function FeedbackInputScreen({ cf, onBack }: Props) {
    const insets = useSafeAreaInsets();

    if (cf.error && !cf.draft) {
        return <ErrorState title="Couldn't read that" message={cf.error} buttonText="Try again" onRetry={cf.structure} />;
    }

    const canSubmit = cf.text.trim().length > 0 && !cf.structuring;

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View className="flex-1 bg-[#050816]" style={{ paddingTop: insets.top }}>
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    <Pressable onPress={onBack} className="mb-4 flex-row items-center active:opacity-70">
                        <ChevronLeft size={20} color="#94a3b8" />
                        <Text className="ml-1 text-slate-400">Back</Text>
                    </Pressable>

                    <Text className="text-3xl font-bold text-white">Coach feedback</Text>
                    <Text className="mt-2 mb-6 leading-6 text-slate-400">
                        Paste what your coach told you, in their words. We'll shape it into a
                        practice plan — you get to review every word before it's saved.
                    </Text>

                    <TextInput
                        value={cf.text}
                        onChangeText={cf.setText}
                        multiline
                        placeholder="e.g. You're getting steep in transition. Feel like you drop the club into the slot and swing more from the inside…"
                        placeholderTextColor="#64748b"
                        className="min-h-[160px] rounded-3xl border border-white/10 bg-white/5 p-4 text-base leading-6 text-white"
                        textAlignVertical="top"
                    />

                    <View className="mt-4 flex-row items-center">
                        <Pressable
                            onPress={cf.pickImage}
                            className="flex-row items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 active:opacity-80"
                        >
                            <ImagePlus size={18} color="#94a3b8" />
                            <Text className="ml-2 text-slate-300">
                                {cf.image ? "Photo added" : "Add a photo of notes"}
                            </Text>
                        </Pressable>
                        {cf.image ? (
                            <Pressable onPress={cf.clearImage} className="ml-3 p-2 active:opacity-70">
                                <X size={18} color="#f87171" />
                            </Pressable>
                        ) : null}
                    </View>
                </ScrollView>

                <View style={{ padding: 20, paddingBottom: Math.max(insets.bottom, 16) }}>
                    <Pressable
                        onPress={cf.structure}
                        disabled={!canSubmit}
                        className={`rounded-2xl px-5 py-4 items-center ${canSubmit ? "bg-emerald-600 active:opacity-80" : "bg-white/10"}`}
                    >
                        <Text className={`text-base font-semibold ${canSubmit ? "text-white" : "text-slate-500"}`}>
                            {cf.structuring ? "Reading…" : "Shape my plan"}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
