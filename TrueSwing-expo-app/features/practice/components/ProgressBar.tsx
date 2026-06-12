import { View } from "react-native";

type Props = {
    succeeded: number;
    failed: number;
    total: number;
};

export function ProgressBar({ succeeded, failed, total }: Props) {
    const successPct = total > 0 ? (succeeded / total) * 100 : 0;
    const failedPct = total > 0 ? (failed / total) * 100 : 0;

    return (
        <View className="h-4 rounded-full bg-white/10 flex-row overflow-hidden my-5">
            <View
                className="rounded-full bg-green-400 transition-all duration-500 will-change-width"
                style={{ width: `${successPct}%` }}
            />
            <View className="flex-1" />
            <View
                className="rounded-full bg-red-500 transition-all duration-500 will-change-width"
                style={{ width: `${failedPct}%` }}
            />
        </View>
    );
}