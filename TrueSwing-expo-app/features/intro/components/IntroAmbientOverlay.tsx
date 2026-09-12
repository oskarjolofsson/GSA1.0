import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/**
 * The flat dim + bottom gradient that sits on top of the picking screens'
 * background photo. Rendered exactly once at the `IntroFlow` level, never
 * inside the per-screen sliding transition and never keyed by screen — a
 * layer that changed with the animation was exactly the bug: opacity on a
 * screen meant opacity on its darkening too, so mid-transition the image
 * briefly showed undimmed. This layer is now static: it neither slides nor
 * fades, ever, in either direction. Only the photo underneath it swaps per
 * screen (see `IntroFlow.tsx`), and only the content above it slides. */
export default function IntroAmbientOverlay() {
    return (
        <>
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
        </>
    );
}
