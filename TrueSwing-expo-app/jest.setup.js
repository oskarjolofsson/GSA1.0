/* global jest */
// Global test setup. Individual suites mock the modules they need
// (supabase, apiClient, react-native-purchases) to keep the native bridge out.

// `lib/supabase` calls createClient at module scope and supabase-js rejects a blank URL,
// so anything that reaches lib/apiClient needs these present. Deliberately unreachable
// values: no suite should ever make a real request, and if one somehow does, it fails
// loudly against localhost rather than quietly against a real project.
process.env.EXPO_PUBLIC_SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';
process.env.EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

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

// AsyncStorage has no native module under jest, and `lib/supabase` imports it at module
// scope. That import is reached by anything that touches `lib/apiClient`, which is every
// feature service -- so even a suite that automocks a service still loads this chain,
// because building an automock requires loading the real module to read its shape.
// In-memory implementation rather than a stub: supabase's auth client actually calls it.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key) => (store.has(key) ? store.get(key) : null)),
      setItem: jest.fn(async (key, value) => void store.set(key, value)),
      removeItem: jest.fn(async (key) => void store.delete(key)),
      clear: jest.fn(async () => store.clear()),
      getAllKeys: jest.fn(async () => Array.from(store.keys())),
      multiGet: jest.fn(async (keys) => keys.map((k) => [k, store.get(k) ?? null])),
      multiSet: jest.fn(async (pairs) => pairs.forEach(([k, v]) => store.set(k, v))),
      multiRemove: jest.fn(async (keys) => keys.forEach((k) => store.delete(k))),
    },
  };
});
