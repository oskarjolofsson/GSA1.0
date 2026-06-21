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
            className="flex-row items-center justify-between active:opacity-70"
        >
            <View className="flex-row items-center gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-full border border-sand/15 bg-ink">
                    <Film size={18} color="#EADFC8" />
                </View>
                <Text className="font-sans-semibold text-[17px] text-sand">Your swings</Text>
            </View>
            <ChevronRight size={20} color="#8A8676" />
        </Pressable>
    );
}
