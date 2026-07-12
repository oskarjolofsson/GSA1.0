import {
    View, Text, TextInput, Pressable, ScrollView,
    KeyboardAvoidingView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Trash2, Sparkles } from "lucide-react-native";

import ErrorState from "features/shared/components/ErrorState";
import type { useCoachFeedback } from "../useCoachFeedback";
import type { DraftDrill } from "features/issues/services/issueAuthoringService";

type Props = {
    cf: ReturnType<typeof useCoachFeedback>;
    onBack: () => void;
    onDone: () => void;
};

function FieldLabel({ label, aiGuessed }: { label: string; aiGuessed: boolean }) {
    return (
        <View className="flex-row items-center mb-2">
            <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</Text>
            {aiGuessed ? (
                <View className="ml-2 flex-row items-center rounded-full bg-amber-500/10 border border-amber-400/20 px-2 py-0.5">
                    <Sparkles size={11} color="#fbbf24" />
                    <Text className="ml-1 text-[10px] font-semibold text-amber-300">AI-guessed — confirm</Text>
                </View>
            ) : null}
        </View>
    );
}

function Field({
    label, value, onChangeText, aiGuessed = false, multiline = false,
}: {
    label: string; value: string; onChangeText: (t: string) => void;
    aiGuessed?: boolean; multiline?: boolean;
}) {
    return (
        <View className="mt-4 first:mt-0">
            <FieldLabel label={label} aiGuessed={aiGuessed} />
            <TextInput
                value={value}
                onChangeText={onChangeText}
                multiline={multiline}
                placeholderTextColor="#64748b"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white"
                textAlignVertical={multiline ? "top" : "center"}
            />
        </View>
    );
}

export default function FeedbackReviewScreen({ cf, onBack, onDone }: Props) {
    const insets = useSafeAreaInsets();
    const draft = cf.draft;

    if (cf.error && draft) {
        return <ErrorState title="Couldn't save that" message={cf.error} buttonText="Back" onRetry={onBack} />;
    }
    if (!draft) return null;

    const isAi = (drill: DraftDrill, field: string) => drill.ai_filled.includes(field);

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View className="flex-1 bg-[#050816]" style={{ paddingTop: insets.top }}>
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    <Pressable onPress={onBack} className="mb-4 flex-row items-center active:opacity-70">
                        <ChevronLeft size={20} color="#94a3b8" />
                        <Text className="ml-1 text-slate-400">Edit notes</Text>
                    </Pressable>

                    <Text className="text-3xl font-bold text-white">Review your plan</Text>
                    <Text className="mt-2 mb-6 leading-6 text-slate-400">
                        Everything here is editable. Fields tagged "AI-guessed" weren't in your
                        notes — check them before you start.
                    </Text>

                    {/* Reuse an existing focus if the feedback looks like a known issue. */}
                    {draft.similar_issues.length > 0 ? (
                        <View className="mb-6 rounded-3xl border border-blue-400/20 bg-blue-500/10 p-4">
                            <Text className="font-semibold text-blue-200">Already in the library?</Text>
                            <Text className="mt-1 mb-3 text-slate-300">
                                This looks like an existing focus. Use it as-is (with its drills) instead
                                of creating a new one.
                            </Text>
                            {draft.similar_issues.map((s) => (
                                <Pressable
                                    key={s.id}
                                    onPress={() => cf.useSimilarIssue(s, onDone)}
                                    className="mb-2 flex-row items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 active:opacity-80"
                                >
                                    <Text className="flex-1 text-white">{s.title}</Text>
                                    <Text className="ml-3 text-sm font-semibold text-blue-300">Use this</Text>
                                </Pressable>
                            ))}
                        </View>
                    ) : null}

                    {/* Issue */}
                    <View className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-5">
                        <Text className="mb-4 text-lg font-bold text-white">The issue</Text>
                        <Field label="Title" value={draft.issue.title} onChangeText={(t) => cf.setIssue({ title: t })} />
                        <Field label="Description" value={draft.issue.description} onChangeText={(t) => cf.setIssue({ description: t })} multiline />
                    </View>

                    {/* Drills */}
                    {draft.drills.map((drill, i) => (
                        <View key={i} className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-lg font-bold text-white">Drill {i + 1}</Text>
                                <Pressable onPress={() => cf.removeDrill(i)} className="p-1 active:opacity-70">
                                    <Trash2 size={18} color="#f87171" />
                                </Pressable>
                            </View>
                            <View className="mt-3">
                                <Field label="Title" value={drill.title} onChangeText={(t) => cf.setDrill(i, { title: t })} aiGuessed={isAi(drill, "title")} />
                                <Field label="Task" value={drill.task} onChangeText={(t) => cf.setDrill(i, { task: t })} aiGuessed={isAi(drill, "task")} multiline />
                                <Field label="Success signal" value={drill.success_signal} onChangeText={(t) => cf.setDrill(i, { success_signal: t })} aiGuessed={isAi(drill, "success_signal")} multiline />
                                <Field label="Fault indicator" value={drill.fault_indicator} onChangeText={(t) => cf.setDrill(i, { fault_indicator: t })} aiGuessed={isAi(drill, "fault_indicator")} multiline />
                            </View>
                        </View>
                    ))}
                </ScrollView>

                <View style={{ padding: 20, paddingBottom: Math.max(insets.bottom, 16) }}>
                    <Pressable
                        onPress={() => cf.confirm(onDone)}
                        disabled={!draft.issue.title.trim()}
                        className={`rounded-2xl px-5 py-4 items-center ${draft.issue.title.trim() ? "bg-emerald-600 active:opacity-80" : "bg-white/10"}`}
                    >
                        <Text className={`text-base font-semibold ${draft.issue.title.trim() ? "text-white" : "text-slate-500"}`}>
                            Start this plan
                        </Text>
                    </Pressable>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
