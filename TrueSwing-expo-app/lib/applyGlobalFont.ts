import React from "react";
import {
    Text as RNText,
    TextInput as RNTextInput,
    StyleSheet,
    type StyleProp,
    type TextStyle,
} from "react-native";

type StyledElement = React.ReactElement<{ style?: StyleProp<TextStyle> }>;

/**
 * App-wide default font: patches the host Text/TextInput render once so every text node
 * picks up the matching Hanken Grotesk weight, instead of editing 50+ screens.
 *
 * An explicit fontFamily (Fraunces via `font-display`) is left alone. Weights below 400
 * fall back to Regular — Light is not bundled.
 */
const HANKEN_BY_WEIGHT: Record<string, string> = {
    "100": "HankenGrotesk_400Regular",
    "200": "HankenGrotesk_400Regular",
    "300": "HankenGrotesk_400Regular",
    "400": "HankenGrotesk_400Regular",
    normal: "HankenGrotesk_400Regular",
    "500": "HankenGrotesk_500Medium",
    "600": "HankenGrotesk_600SemiBold",
    "700": "HankenGrotesk_700Bold",
    "800": "HankenGrotesk_700Bold",
    "900": "HankenGrotesk_700Bold",
    bold: "HankenGrotesk_700Bold",
};

let patched = false;

export function applyGlobalFont(): void {
    if (patched) return;
    patched = true;

    for (const Component of [RNText, RNTextInput] as { render?: (...a: unknown[]) => StyledElement }[]) {
        const originalRender = Component.render;
        if (!originalRender) continue; // class components (no static render) are skipped

        Component.render = function patchedRender(...args: unknown[]) {
            const element = originalRender.apply(this, args);
            const flattened = (StyleSheet.flatten(element.props.style) ?? {}) as {
                fontFamily?: string;
                fontWeight?: string | number;
            };

            // An explicit fontFamily (Fraunces, etc.) always wins.
            if (flattened.fontFamily) return element;

            const weight = String(flattened.fontWeight ?? "normal");
            const fontFamily = HANKEN_BY_WEIGHT[weight] ?? "HankenGrotesk_400Regular";

            // Drop fontWeight: the family already encodes it, so leaving it set
            // would trigger synthetic bolding on top (Android especially).
            const { fontWeight: _dropped, ...rest } = flattened;

            return React.cloneElement(element, { style: { ...rest, fontFamily } });
        };
    }
}
