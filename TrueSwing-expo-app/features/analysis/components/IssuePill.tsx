import { TouchableOpacity, Text, View } from "react-native";

export default function IssuePill({
    label,
    active,
    onPress,
}: {
    label: string | null | undefined;
    active: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            className={`mr-2 rounded-full border px-4 py-2 ${active ? "border-white bg-white" : "border-white/20 bg-black/35"
                }`}
        >
            <Text
                numberOfLines={1}
                className={`text-sm font-medium ${active ? "text-black" : "text-white"
                    }`}
            >
                {label || "Unknown Issue"}
            </Text>
        </TouchableOpacity>
    );
}