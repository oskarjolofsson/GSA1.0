import { View, TextInput, Pressable } from "react-native";
import { Search, X } from "lucide-react-native";

type Props = {
    value: string;
    onChange: (text: string) => void;
    /** Set when the bar was just revealed by the golfer tapping the magnifier,
     *  so the keyboard comes up with it and the tap costs one action, not two. */
    autoFocus?: boolean;
};

/** Controlled search input: a rule, not a filled pill. Searching is flat over
 *  focus points and bypasses the hierarchy, which is what the placeholder says
 *  out loud. Filtering itself lives in useLibraryState (client-side). */
export default function SearchBar({ value, onChange, autoFocus = false }: Props) {
    return (
        <View className="mt-6 flex-row items-center border-b border-white/[.13] pb-3">
            <Search size={14} color="#8A8676" />
            <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Search focus points"
                placeholderTextColor="#8A8676"
                className="ml-3 flex-1 py-1 text-[14px] text-sand"
                autoFocus={autoFocus}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
            />
            {value.length > 0 ? (
                <Pressable onPress={() => onChange("")} hitSlop={12} className="active:opacity-60">
                    <X size={16} color="#8A8676" />
                </Pressable>
            ) : null}
        </View>
    );
}
