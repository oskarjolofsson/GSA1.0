import { View } from "react-native";

/** Placeholder rules while a fetch is in flight. Same rhythm as the real rows so
 *  nothing jumps when the data lands. */
export default function SkeletonRows({ count = 5 }: { count?: number }) {
    return (
        <View className="mt-6">
            {Array.from({ length: count }).map((_, index) => (
                <View
                    key={index}
                    className="min-h-[60px] justify-center border-b border-white/[.07] py-4"
                >
                    <View className="h-[14px] w-2/3 rounded bg-white/[.07]" />
                    <View className="mt-2 h-[11px] w-1/2 rounded bg-white/[.07]" />
                </View>
            ))}
        </View>
    );
}
