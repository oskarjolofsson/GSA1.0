import {
    View,
    Text,
    ScrollView,
    Pressable,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useEffect, useState, type ReactNode } from "react";
import type { ScreenProps } from "features/shared/types";
import type { UsePromptReturn } from "../hooks/usePrompt";

type Props = ScreenProps & {
    prompt: UsePromptReturn;
    onDeleteCache: () => void;
};

type ChipProps = {
    label: string;
    selected: boolean;
    onPress: () => void;
    disabled?: boolean;
    activeColorClass?: string;
};

type SectionCardProps = {
    title: string;
    titleColorClass?: string;
    containerClassName?: string;
    children: ReactNode;
};

type FieldGroupProps = {
    label: string;
    children: ReactNode;
};

const Chip = ({
    label,
    selected,
    onPress,
    disabled = false,
    activeColorClass = "bg-blue-600 border-blue-500",
}: ChipProps) => (
    <Pressable
        onPress={disabled ? undefined : onPress}
        className={`mr-2 mb-2 rounded-2xl border px-4 py-3 ${disabled
                ? "border-white/5 bg-white/5 opacity-40"
                : selected
                    ? activeColorClass
                    : "border-white/10 bg-white/5"
            }`}
    >
        <Text
            className={`text-sm font-semibold ${disabled ? "text-gray-500" : selected ? "text-white" : "text-gray-200"
                }`}
        >
            {label}
        </Text>
    </Pressable>
);

const SectionCard = ({
    title,
    titleColorClass = "text-white",
    containerClassName = "",
    children,
}: SectionCardProps) => (
    <View
        className={`mb-6 rounded-3xl border bg-white/5 p-5 ${containerClassName}`}
    >
        <Text className={`text-xl font-semibold ${titleColorClass}`}>{title}</Text>
        <View className="mt-5">{children}</View>
    </View>
);

const FieldGroup = ({ label, children }: FieldGroupProps) => (
    <View className="mt-5 first:mt-0">
        <Text className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            {label}
        </Text>
        <View className="mt-3 flex-row flex-wrap">{children}</View>
    </View>
);

export default function PromptScreen({ onBack, onNext, prompt, onDeleteCache }: Props) {
    const { prompt: promptData, setDesiredShot, setMiss, setExtra } = prompt;

    const [dHeight, setDHeight] = useState<string | null>(() => {
        const parts = promptData.desired_shot.split(", ");
        return parts.find((p) => ["Low", "Mid", "High"].includes(p)) || null;
    });
    const [dShape, setDShape] = useState<string | null>(() => {
        const parts = promptData.desired_shot.split(", ");
        return parts.find((p) => ["Straight", "Fade", "Draw"].includes(p)) || null;
    });

    const [mStrike, setMStrike] = useState<string | null>(() => {
        const parts = promptData.miss.split(", ");
        return parts.find((p) => ["Thin/Top", "Thick/Duff", "Shank", "Toe"].includes(p)) || null;
    });
    const [mHeight, setMHeight] = useState<string | null>(() => {
        const parts = promptData.miss.split(", ");
        return parts.find((p) => ["Too High", "Too Low"].includes(p)) || null;
    });
    const [mShape, setMShape] = useState<string | null>(() => {
        const parts = promptData.miss.split(", ");
        return parts.find((p) => ["Slice/Fade", "Draw/Hook"].includes(p)) || null;
    });
    const [mInconsistent, setMInconsistent] = useState(promptData.miss.includes("Inconsistent"));

    useEffect(() => {
        const desired = [dHeight, dShape].filter(Boolean).join(", ");
        setDesiredShot(desired);
    }, [dHeight, dShape, setDesiredShot]);

    useEffect(() => {
        if (mInconsistent) {
            setMiss("Inconsistent");
            return;
        }

        const missParts = [mStrike, mHeight, mShape].filter(Boolean);
        setMiss(missParts.join(", "));
    }, [mStrike, mHeight, mShape, mInconsistent, setMiss]);

    const handleInconsistentToggle = () => {
        const nextValue = !mInconsistent;
        setMInconsistent(nextValue);

        if (nextValue) {
            setMStrike(null);
            setMHeight(null);
            setMShape(null);
        }
    };

    const renderChipGroup = (
        options: string[],
        selectedValue: string | null,
        onSelect: (value: string | null) => void,
        disabled = false,
        activeColorClass = "bg-blue-600 border-blue-500"
    ) =>
        options.map((option) => (
            <Chip
                key={option}
                label={option}
                selected={selectedValue === option}
                disabled={disabled}
                activeColorClass={activeColorClass}
                onPress={() => onSelect(selectedValue === option ? null : option)}
            />
        ));

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-[#0B0D12]"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            {/* Sticky header */}
            <View className="border-b border-white/10 bg-[#0B0D12]/95 px-4 pb-4 pt-14">
                <Text className="text-3xl font-bold tracking-tight text-white">
                    Shot Details
                </Text>
            </View>

            {/* <View className="">
                <Pressable onPress={() => {console.log("Debug: Clear AI Consent"); onDeleteCache();}} className="absolute top-4 right-4 z-50 rounded-full bg-red-600 px-3 py-1">
                    <Text className="text-sm text-gray-400 mt-2 mb-4 px-4">
                        Delete cache, debug
                    </Text>
                </Pressable>
            </View> */}

            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 18,
                    paddingBottom: 130,
                }}
                showsVerticalScrollIndicator={false}
            >
                <SectionCard
                    title="Desired Shot"
                    titleColorClass="text-emerald-400"
                    containerClassName="border-emerald-500/20 bg-emerald-500/5"
                >
                    <FieldGroup label="Height">
                        {renderChipGroup(
                            ["Low", "Mid", "High"],
                            dHeight,
                            setDHeight,
                            false,
                            "bg-emerald-600 border-emerald-500"
                        )}
                    </FieldGroup>

                    <FieldGroup label="Shape">
                        {renderChipGroup(
                            ["Straight", "Fade", "Draw"],
                            dShape,
                            setDShape,
                            false,
                            "bg-emerald-600 border-emerald-500"
                        )}
                    </FieldGroup>
                </SectionCard>

                <SectionCard
                    title="Typical Miss"
                    titleColorClass="text-rose-400"
                    containerClassName="border-rose-500/20 bg-rose-500/5"
                >
                    <FieldGroup label="Pattern">
                        <Chip
                            label="Inconsistent"
                            selected={mInconsistent}
                            onPress={handleInconsistentToggle}
                            activeColorClass="bg-rose-600 border-rose-500"
                        />
                    </FieldGroup>

                    <FieldGroup label="Strike">
                        {renderChipGroup(
                            ["Thin/Top", "Thick/Duff", "Shank", "Toe"],
                            mStrike,
                            setMStrike,
                            mInconsistent,
                            "bg-rose-600 border-rose-500"
                        )}
                    </FieldGroup>

                    <FieldGroup label="Height">
                        {renderChipGroup(
                            ["Too High", "Too Low"],
                            mHeight,
                            setMHeight,
                            mInconsistent,
                            "bg-rose-600 border-rose-500"
                        )}
                    </FieldGroup>

                    <FieldGroup label="Shape">
                        {renderChipGroup(
                            ["Slice/Fade", "Draw/Hook"],
                            mShape,
                            setMShape,
                            mInconsistent,
                            "bg-rose-600 border-rose-500"
                        )}
                    </FieldGroup>
                </SectionCard>

                <SectionCard
                    title="Additional Notes"
                    containerClassName="border-white/10 bg-white/5"
                >
                    <TextInput
                        className="min-h-[130px] rounded-2xl border border-white/10 bg-white/5 p-4 text-white"
                        placeholder="Add details..."
                        placeholderTextColor="#6B7280"
                        multiline
                        textAlignVertical="top"
                        value={promptData.extra}
                        onChangeText={setExtra}
                    />
                </SectionCard>
            </ScrollView>

            {/* Sticky footer */}
            <View className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#0B0D12]/95 px-4 pt-3 pb-8">
                <View className="flex-row">
                    <Pressable
                        className="mr-1.5 flex-1 items-center rounded-2xl bg-white/5 py-4"
                        onPress={onBack}
                    >
                        <Text className="text-base font-semibold text-white">Go Back</Text>
                    </Pressable>

                    <Pressable
                        className="ml-1.5 flex-1 items-center rounded-2xl bg-blue-600 py-4"
                        onPress={onNext}
                    >
                        <Text className="text-base font-semibold text-white">Start Analysis</Text>
                    </Pressable>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}