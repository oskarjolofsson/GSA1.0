import { View, Text, Pressable } from "react-native";

type Props = {
    message: string | null;
    onRetry: () => void;
};

/** Inline failure: says the true thing and gives one way out, without taking the
 *  whole screen down with it. A fetch that fails here must not hide content that
 *  another fetch already delivered. */
export default function InlineRetry({ message, onRetry }: Props) {
    return (
        <View className="mt-8">
            <Text className="text-[13px] leading-[21px] text-sand-dim">
                {message ?? "Couldn't load this."}
            </Text>
            <Pressable
                onPress={onRetry}
                accessibilityRole="button"
                className="mt-4 min-h-[44px] justify-center active:opacity-70"
            >
                <Text className="text-[13px] uppercase tracking-[1.6px] text-gold">Try again</Text>
            </Pressable>
        </View>
    );
}
