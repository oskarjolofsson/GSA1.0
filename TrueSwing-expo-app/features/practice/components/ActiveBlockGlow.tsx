import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";

// Ambient "the block is live" glow. A slow-breathing edge glow that signals it's time
// to hit balls during the active phase, without a focal object that would pull the
// golfer's eyes off the ball. Purely decorative — never captures touches.
//
// Warm gold, not the emerald this used to be: green is not in the TrueSwing palette
// (ink / sand / gold), and an off-brand colour breathing at the edge of the screen for
// the whole block is the most visible place to get that wrong.

const GLOW = "rgba(228,200,146,0.45)";       // gold #E4C892
const TRANSPARENT = "rgba(228,200,146,0)";
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
        colors={[GLOW, TRANSPARENT]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.edge, { top: 0, left: 0, right: 0, height: EDGE }]}
      />
      <LinearGradient
        colors={[TRANSPARENT, GLOW]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.edge, { bottom: 0, left: 0, right: 0, height: EDGE }]}
      />
      <LinearGradient
        colors={[GLOW, TRANSPARENT]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.edge, { top: 0, bottom: 0, left: 0, width: EDGE }]}
      />
      <LinearGradient
        colors={[TRANSPARENT, GLOW]}
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
