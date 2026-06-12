import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Drill } from 'features/drill/types/Drill';
import { parseInstructionSteps } from 'features/practice/utils/parseInstructionSteps';

type DrillInstructionsOverlayProps = {
    visible: boolean;
    drill: Drill | null;
    onClose: () => void;
};

const OPEN_DELAY_MS = 60;
const ENTER_DURATION_MS = 220;
const EXIT_DURATION_MS = 170;

export default function DrillInstructionsOverlay({ visible, drill, onClose }: DrillInstructionsOverlayProps) {
    const [isMounted, setIsMounted] = useState(visible);
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;
    const contentTranslateY = useRef(new Animated.Value(12)).current;

    const steps = useMemo(() => parseInstructionSteps(drill?.task), [drill?.task]);

    useEffect(() => {
        let enterDelay: ReturnType<typeof setTimeout> | null = null;

        if (visible) {
            setIsMounted(true);
            backdropOpacity.setValue(0);
            contentOpacity.setValue(0);
            contentTranslateY.setValue(12);

            enterDelay = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(backdropOpacity, {
                        toValue: 1,
                        duration: ENTER_DURATION_MS,
                        useNativeDriver: true,
                    }),
                    Animated.timing(contentOpacity, {
                        toValue: 1,
                        duration: ENTER_DURATION_MS,
                        useNativeDriver: true,
                    }),
                    Animated.timing(contentTranslateY, {
                        toValue: 0,
                        duration: ENTER_DURATION_MS,
                        useNativeDriver: true,
                    }),
                ]).start();
            }, OPEN_DELAY_MS);
        } else if (isMounted) {
            Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: EXIT_DURATION_MS,
                    useNativeDriver: true,
                }),
                Animated.timing(contentOpacity, {
                    toValue: 0,
                    duration: EXIT_DURATION_MS,
                    useNativeDriver: true,
                }),
                Animated.timing(contentTranslateY, {
                    toValue: 10,
                    duration: EXIT_DURATION_MS,
                    useNativeDriver: true,
                }),
            ]).start(({ finished }) => {
                if (finished) {
                    setIsMounted(false);
                }
            });
        }

        return () => {
            if (enterDelay) clearTimeout(enterDelay);
        };
    }, [backdropOpacity, contentOpacity, contentTranslateY, isMounted, visible]);

    if (!isMounted) return null;

    return (
        <Modal
            visible
            transparent
            animationType="none"
            presentationStyle="overFullScreen"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <Animated.View
                style={{ opacity: backdropOpacity }}
                className="flex-1 bg-slate-950"
            >
                <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
                    <Animated.View
                        style={{
                            opacity: contentOpacity,
                            transform: [{ translateY: contentTranslateY }],
                        }}
                        className="flex-1"
                    >
                        <View className="flex-row items-center justify-between border-b border-white/10 bg-slate-950 px-5 py-4">
                            <Text className="text-[11px] font-semibold uppercase tracking-[2.2px] text-slate-400">
                                Practice drill
                            </Text>

                            <Pressable
                                onPress={onClose}
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 active:bg-white/10"
                                accessibilityRole="button"
                                accessibilityLabel="Close instructions"
                            >
                                <Text className="text-xs font-semibold uppercase tracking-[1.6px] text-slate-200">
                                    Close
                                </Text>
                            </Pressable>
                        </View>

                        <View
                            className="flex-col flex-1 justify-center"
                            
                        >
                            <View className="px-5 pt-4">
                                <Text className="text-3xl font-extrabold leading-[36px] text-white">
                                    {drill?.title ?? 'Drill instructions'}
                                </Text>
                            </View>

                            <View className="mt-5 gap-3 px-5">
                                {steps.length > 0 ? (
                                    steps.map((step, index) => (
                                        <View
                                            key={`${drill?.id ?? 'step'}-${index}`}
                                            className="flex-row items-start gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                                        >
                                            <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-full bg-white/10">
                                                <Text className="text-xl font-bold text-white">{index + 1}</Text>
                                            </View>

                                            <Text className="flex-1 text-xl leading-8 text-slate-100">
                                                {step}
                                            </Text>
                                        </View>
                                    ))
                                ) : (
                                    <View className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                                        <Text className="text-base leading-6 text-slate-200">
                                            Error displaying instructions. Please try again later.
                                        </Text>
                                    </View>
                                )}
                            </View>
{/* 
                            <View className="mt-6 gap-3 px-5">
                                <View className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                                    <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-emerald-300">
                                        Success signal
                                    </Text>
                                    <Text className="mt-2 text-base leading-6 text-emerald-100">
                                        {drill?.success_signal || 'Your movement should feel smooth and controlled.'}
                                    </Text>
                                </View>

                                <View className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4">
                                    <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-rose-200">
                                        Fault indicator
                                    </Text>
                                    <Text className="mt-2 text-base leading-6 text-rose-100">
                                        {drill?.fault_indicator || 'If motion feels rushed or off-balance, reset your setup and repeat.'}
                                    </Text>
                                </View>
                            </View> */}
                        </View>

                        <View className="border-t border-white/10 bg-slate-950 px-5 py-4">
                            <Pressable
                                onPress={onClose}
                                className="items-center rounded-2xl bg-white py-4 active:bg-slate-100"
                                accessibilityRole="button"
                                accessibilityLabel="Start practice"
                            >
                                <Text className="text-lg font-bold text-slate-900">Start practice</Text>
                            </Pressable>
                        </View>
                    </Animated.View>
                </SafeAreaView>
            </Animated.View>
        </Modal>
    );
}
