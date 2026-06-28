import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, FlatList, Image, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ChevronLeft, Film } from "lucide-react-native";
import VideoScrubber from "features/scrubber/screens/VideoScrubber";
import useVideoURL from "features/analysis/hooks/useVideoURL";
import analysisService from "features/analysis/services/analysisService";
import type { Analysis, IssueSwingTimelineItem } from "features/analysis/types";
import type { Issue } from "features/issues/types";

type SwingHistoryScreenProps = {
    issue: Issue;
    onBack: () => void;
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// The AI's read of this issue per swing — reference only, the player judges the clip.
function readLabel(item: IssueSwingTimelineItem, isLatest: boolean): { text: string; color: string } {
    if (!item.detected) {
        return {
            text: isLatest ? "Not detected · likely improved" : "Not detected",
            color: "#6FCF97",
        };
    }
    const pct = Math.round((item.confidence ?? 0) * 100);
    return { text: `AI still sees it · ${pct}% confidence`, color: "#E0A458" };
}

// Per-issue progress lens: the user's swings over time annotated with the AI's
// read of THIS issue (confidence, or "not detected"). The issue trending away is
// the proof of improvement. Tap any swing to watch it full-screen and judge for
// yourself.
export default function SwingHistoryScreen({ issue, onBack }: SwingHistoryScreenProps) {
    const insets = useSafeAreaInsets();
    const [items, setItems] = useState<IssueSwingTimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<IssueSwingTimelineItem | null>(null);

    // useVideoURL only reads analysis_id + video_id, both present on the item.
    const videoURL = useVideoURL(selected as unknown as Analysis | null);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const list = await analysisService.getIssueSwingTimeline(issue.id);
                if (active) setItems(list);
            } catch (err) {
                if (active) setError(err instanceof Error ? err.message : "Failed to load swings");
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [issue.id]);

    const renderItem = useCallback(
        ({ item, index }: { item: IssueSwingTimelineItem; index: number }) => {
            const read = readLabel(item, index === 0);
            return (
                <Pressable
                    onPress={() => setSelected(item)}
                    className="mb-3 flex-row items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-3 active:bg-white/10"
                >
                    <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-ink">
                        {item.thumbnail_url ? (
                            <Image source={{ uri: item.thumbnail_url }} className="h-full w-full" resizeMode="cover" />
                        ) : (
                            <Film size={22} color="#8A8676" />
                        )}
                    </View>
                    <View className="flex-1">
                        <Text className="font-display-bold text-[17px] text-sand">{formatDate(item.created_at)}</Text>
                        <Text className="mt-1 font-sans-medium text-[13px]" style={{ color: read.color }}>
                            {read.text}
                        </Text>
                    </View>
                </Pressable>
            );
        },
        []
    );

    // Player view — a selected clip plays full-screen.
    if (selected) {
        return (
            <View className="flex-1 bg-ink" style={{ paddingTop: insets.top }}>
                <Pressable
                    onPress={() => setSelected(null)}
                    hitSlop={8}
                    className="m-4 flex-row items-center gap-1 self-start active:opacity-70"
                >
                    <ChevronLeft size={20} color="#E4C892" />
                    <Text className="font-sans-medium text-[15px] text-sand">All swings</Text>
                </Pressable>
                <View className="flex-1 px-4 pb-6">
                    {videoURL ? (
                        <VideoScrubber videoUri={videoURL} mode="playback" />
                    ) : (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator color="#E4C892" />
                        </View>
                    )}
                    <Text className="mt-3 text-center font-sans text-[13px] text-sand-dim">
                        {formatDate(selected.created_at)} · {readLabel(selected, false).text}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-ink" style={{ paddingTop: insets.top }}>
            <View className="flex-row items-center gap-2 px-4 pt-2 pb-2">
                <Pressable onPress={onBack} hitSlop={8} className="p-1 active:opacity-70">
                    <ArrowLeft size={22} color="#E4C892" />
                </Pressable>
                <View className="flex-1">
                    <Text className="font-sans-medium text-[11px] uppercase tracking-[2px] text-sand-dim">
                        Your swings · over time
                    </Text>
                    <Text numberOfLines={1} className="font-display-bold text-[22px] text-sand">
                        {issue.title}
                    </Text>
                </View>
            </View>

            <Text className="px-5 pb-3 font-sans text-[13px] leading-snug text-sand-dim">
                The AI&apos;s read of this issue over time — you be the judge. Tap a swing to watch it.
            </Text>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#E4C892" />
                </View>
            ) : error ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-center font-sans text-[15px] text-sand-dim">{error}</Text>
                </View>
            ) : items.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Film size={28} color="#8A8676" />
                    <Text className="mt-3 text-center font-sans text-[15px] text-sand-dim">
                        No swings for this issue yet. Re-test to capture one you can compare against later.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(i) => i.analysis_id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
                />
            )}
        </View>
    );
}
