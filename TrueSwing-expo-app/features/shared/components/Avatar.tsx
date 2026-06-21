import { View, Text, Image } from "react-native";

import { getInitials } from "features/shared/utils/getInitials";

type AvatarProps = {
    photoURL?: string | null;
    name?: string | null;
    email?: string | null;
    size?: number; // px diameter, default 40
    shape?: "circle" | "rounded";
};

// Presentational avatar: shows the account image when available, otherwise
// centered initials. No auth/router coupling — callers pass the fields and
// wrap it in a Pressable when it should act as a button.
export default function Avatar({
    photoURL,
    name,
    email,
    size = 40,
    shape = "circle",
}: AvatarProps) {
    const radius = shape === "circle" ? size / 2 : 16;
    const dimension = { width: size, height: size, borderRadius: radius };

    if (photoURL) {
        return (
            <Image
                source={{ uri: photoURL }}
                style={dimension}
                resizeMode="cover"
            />
        );
    }

    return (
        <View
            className="items-center justify-center bg-indigo-500/15"
            style={dimension}
        >
            <Text
                className="font-semibold text-indigo-200"
                style={{ fontSize: size * 0.4 }}
            >
                {getInitials(name, email)}
            </Text>
        </View>
    );
}
