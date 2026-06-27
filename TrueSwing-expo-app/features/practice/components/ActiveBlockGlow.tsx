import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";

// Ambient "the block is live" glow. A slow-breathing emerald edge glow that signals
// it's time to hit balls during the active phase, without a focal object that would
// pull the golfer's eyes off the ball. Purely decorative — never captures touches.

const EMERALD = "rgba(16,185,129,0.55)";
const TRANSPARENT = "rgba(16,185,129,0)";
const EDGE = 120;

export default function ActiveBlockGlow() {
  return (
    <MotiView
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      from={{ opacity: 0.15 }}
      animate={{ opacity: 0.55 }}
      transition={{ type: "timing", duration: 1400, loop: true, repeatReverse: true }}
    >
      <LinearGradient
        colors={[EMERALD, TRANSPARENT]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.edge, { top: 0, left: 0, right: 0, height: EDGE }]}
      />
      <LinearGradient
        colors={[TRANSPARENT, EMERALD]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.edge, { bottom: 0, left: 0, right: 0, height: EDGE }]}
      />
      <LinearGradient
        colors={[EMERALD, TRANSPARENT]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.edge, { top: 0, bottom: 0, left: 0, width: EDGE }]}
      />
      <LinearGradient
        colors={[TRANSPARENT, EMERALD]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.edge, { top: 0, bottom: 0, right: 0, width: EDGE }]}
      />
    </MotiView>
  );
}

const styles = StyleSheet.create({
  edge: {
    position: "absolute",
  },
});
