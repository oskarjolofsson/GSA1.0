/* global jest */
// Global test setup. Individual suites mock the modules they need
// (supabase, apiClient, react-native-purchases) to keep the native bridge out.

// lucide-react-native icons render via react-native-svg, which isn't wired up
// under jest-expo. Stub every icon as a no-op component so component tests that
// happen to render an icon (ErrorState, OfflineBanner, ...) don't blow up.
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }));

// Reanimated's native worklets can't initialize under jest, and moti imports it
// eagerly. Render every Moti* component as its plain host equivalent: the entrance
// animation is not what these tests assert, the content inside it is.
jest.mock('moti', () => {
  const { View, Text, ScrollView, Image } = jest.requireActual('react-native');
  return { MotiView: View, MotiText: Text, MotiScrollView: ScrollView, MotiImage: Image };
});

// Only the pieces feature code actually reaches for. Reduce-motion defaults to
// off; a suite that cares can override it.
jest.mock('react-native-reanimated', () => ({
  useReducedMotion: () => false,
  Easing: { bezier: () => () => 0, linear: () => 0, ease: () => 0 },
}));
