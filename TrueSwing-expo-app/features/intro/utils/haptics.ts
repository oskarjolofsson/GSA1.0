import * as Haptics from "expo-haptics";

/** One light tap for every button in the intro. Fire-and-forget: haptics are a
 *  nice-to-have, never worth blocking or failing a screen transition over. */
export function tapHaptic(): void {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
