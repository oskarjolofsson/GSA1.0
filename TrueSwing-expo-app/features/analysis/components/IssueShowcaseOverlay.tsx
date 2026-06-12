import { useEffect, useRef } from "react";
import { Dimensions, FlatList, Text, TouchableOpacity, View } from "react-native";
import { ChevronLeft, ChevronRight, Dumbbell } from "lucide-react-native";

import type { Issue } from "features/issues/types";
import IssuePill from "./IssuePill";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

type IssueWithConfidence = Issue & { confidence?: number };

type IssueShowcaseOverlayProps = {
    issues: IssueWithConfidence[];
    activeIssueIndex: number;
    onActiveIssueChange: (index: number) => void;
    startPractice: (activeIssue: Issue) => void;
};

export default function IssueShowcaseOverlay({
    issues,
    activeIssueIndex,
    onActiveIssueChange,
    startPractice,
}: IssueShowcaseOverlayProps) {
    const issueRailRef = useRef<FlatList<IssueWithConfidence>>(null);
    const issueCardsRef = useRef<FlatList<IssueWithConfidence>>(null);

    useEffect(() => {
        if (!issues.length) return;

        issueCardsRef.current?.scrollToIndex({
            index: activeIssueIndex,
            animated: true,
        });

        issueRailRef.current?.scrollToIndex({
            index: activeIssueIndex,
            animated: true,
            viewPosition: 0.5,
        });
    }, [activeIssueIndex, issues.length]);

    const goPrevIssue = () => {
        if (activeIssueIndex <= 0) return;
        onActiveIssueChange(activeIssueIndex - 1);
    };

    const goNextIssue = () => {
        if (activeIssueIndex >= issues.length - 1) return;
        onActiveIssueChange(activeIssueIndex + 1);
    };

    const activeIssue = issues[activeIssueIndex];

    return (
        <SafeAreaView
            className="absolute inset-x-0 bottom-10 z-40"
            style={{ paddingBottom: 10 }}
            pointerEvents="box-none"
        >
            <View className="px-5" pointerEvents="box-none">
                <View pointerEvents="auto">
                    {issues.length > 0 ? (
                        <FlatList
                            ref={issueCardsRef}
                            data={issues}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item.id}
                            onMomentumScrollEnd={(e) => {
                                const index = Math.round(
                                    e.nativeEvent.contentOffset.x /
                                        e.nativeEvent.layoutMeasurement.width
                                );
                                if (index !== activeIssueIndex) {
                                    onActiveIssueChange(index);
                                }
                            }}
                            renderItem={({ item, index }) => (
                                <View
                                    style={{ width: width - 35 }}
                                    className="mb-5 rounded-[28px] border border-white/10 bg-black/35 p-5"
                                >
                                    <Text className="mb-2 text-xs uppercase tracking-widest text-zinc-400">
                                        Issue {index + 1} of {issues.length}
                                    </Text>

                                    <Text className="mb-3 text-3xl font-bold text-white">
                                        {item.title}
                                    </Text>

                                    {!!item.description && (
                                        <Text className="mb-3 text-base leading-6 text-zinc-200">
                                            {item.description}
                                        </Text>
                                    )}

                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        className="mt-5 self-start rounded-2xl bg-white px-5 py-3 flex-row items-center gap-2"
                                        onPress={() => {
                                            if (!activeIssue) return;
                                            startPractice(activeIssue);
                                        }}
                                        disabled={!activeIssue}
                                    >
                                        <Dumbbell size={16} color="#000" />
                                        <Text className="font-semibold text-black">
                                            Start practice
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    ) : (
                        <View className="mb-5 rounded-[28px] border border-white/10 bg-black/35 p-5">
                            <Text className="text-zinc-300">
                                No issues found for this analysis.
                            </Text>
                        </View>
                    )}

                    {issues.length > 0 && (
                        <View className="mb-4">
                            <View className="mb-3 flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                    <TouchableOpacity
                                        onPress={goPrevIssue}
                                        disabled={activeIssueIndex === 0}
                                        className={`mr-2 rounded-full border p-2 ${
                                            activeIssueIndex === 0
                                                ? "border-white/10 bg-black/15"
                                                : "border-white/20 bg-black/35"
                                        }`}
                                    >
                                        <ChevronLeft size={16} color="#fff" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={goNextIssue}
                                        disabled={activeIssueIndex === issues.length - 1}
                                        className={`rounded-full border p-2 ${
                                            activeIssueIndex === issues.length - 1
                                                ? "border-white/10 bg-black/15"
                                                : "border-white/20 bg-black/35"
                                        }`}
                                    >
                                        <ChevronRight size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <FlatList
                                ref={issueRailRef}
                                data={issues}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={{ paddingRight: 12 }}
                                renderItem={({ item, index }) => (
                                    <IssuePill
                                        label={item.title}
                                        active={index === activeIssueIndex}
                                        onPress={() => onActiveIssueChange(index)}
                                    />
                                )}
                            />
                        </View>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}
