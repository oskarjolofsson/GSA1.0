/* global jest */
// Global test setup. Individual suites mock the modules they need
// (supabase, apiClient, react-native-purchases) to keep the native bridge out.

// lucide-react-native icons render via react-native-svg, which isn't wired up
// under jest-expo. Stub every icon as a no-op component so component tests that
// happen to render an icon (ErrorState, OfflineBanner, ...) don't blow up.
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }));
