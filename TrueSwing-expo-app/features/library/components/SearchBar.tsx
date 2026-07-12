import { View, TextInput, Pressable } from "react-native";
import { Search, X } from "lucide-react-native";

type Props = {
    value: string;
    onChange: (text: string) => void;
};

/** Controlled search input. Filtering itself happens in LibraryScreen (client-side). */
export default function SearchBar({ value, onChange }: Props) {
    return (
        <View className="mb-5 flex-row items-center rounded-2xl border border-white/10 bg-white/5 px-4">
            <Search size={18} color="#64748b" />
            <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Search the library…"
                placeholderTextColor="#64748b"
                className="ml-3 flex-1 py-3 text-base text-white"
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
            />
            {value.length > 0 ? (
                <Pressable onPress={() => onChange("")} hitSlop={8} className="active:opacity-60">
                    <X size={18} color="#64748b" />
                </Pressable>
            ) : null}
        </View>
    );
}
