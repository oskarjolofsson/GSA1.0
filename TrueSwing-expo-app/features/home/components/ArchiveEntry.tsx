import React from "react";
import { View, Text, Pressable } from "react-native";
import { Film, ChevronRight } from "lucide-react-native";

type ArchiveEntryProps = {
    onPress?: () => void;
};

export default function ArchiveEntry({ onPress }: ArchiveEntryProps) {
    return (
        <Pressable
            onPress={onPress}
            className="flex-row items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-5 active:bg-white/10"
        >
            <View className="flex-row items-center gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/5">
                    <Film size={20} color="#cbd5e1" />
                </View>
                <View>
                    <Text className="text-base font-semibold text-white">Your swings</Text>
                    <Text className="text-sm text-white/55">Browse all past analyses</Text>
                </View>
            </View>
            <ChevronRight size={20} color="#94a3b8" />
        </Pressable>
    );
}
