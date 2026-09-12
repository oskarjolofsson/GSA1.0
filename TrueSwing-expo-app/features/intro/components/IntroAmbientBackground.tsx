import type { PropsWithChildren } from "react";
import type { ImageSourcePropType } from "react-native";
import { View, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = PropsWithChildren<{
    source: ImageSourcePropType;
}>;


export default function IntroAmbientBackground({ source, children }: Props) {
    return (
        <View className="flex-1 bg-ink">
            <Image
                source={source}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                resizeMode="cover"
            />
            <View
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(10,15,26,0.78)",
                }}
            />
            <LinearGradient
                colors={["transparent", "rgba(10,15,26,0.75)", "#0A0F1A"]}
                locations={[0.3, 0.6, 0.78]}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />
            {children}
        </View>
    );
}
