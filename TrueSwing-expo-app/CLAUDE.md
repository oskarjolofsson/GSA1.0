# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is
React Native Expo app — frontend for a golf coaching product. Users film/select swing videos, trim them, attach prompts, upload to a backend API, and review analysis results later. Auth is Supabase.

## Commands
- `npx expo prebuild` — regenerate `ios/` and `android/` from `app.json` + module config. Required after changes to native modules, plugins, permissions, or anything in `app.json`.
- `npx expo run:ios` / `npx expo run:android` — build and launch on a simulator/device (uses a dev client, not Expo Go — `expo-dev-client` is installed).
- `npm run lint` — ESLint + Prettier check across all JS/TS/JSON.
- `npm run format` — auto-fix lint + Prettier.
- `npm start` — Metro only (use after a native build already exists).

Tests run with Jest (`npm test`) via the `jest-expo` preset; `@testing-library/react-native` is available for component/hook tests. Config lives in `jest.config.js`.

## Architecture

### Routing (`app/`)
Uses **expo-router** with typed file-based routes. No real logic lives here — each route just renders a feature flow/screen.
- `app/_layout.tsx` is the root: wraps everything in `GestureHandlerRootView` → `SafeAreaProvider` → `ThemeProvider(DarkTheme)` → `AuthProvider`. The `GestureHandlerRootView` is load-bearing — gestures in `features/scrubber` won't fire without it.
- `app/(public)/` — unauthenticated routes (sign-in).
- `app/(app)/` — authenticated routes. `(app)/_layout.tsx` reads `useAuth()` and redirects to `/(public)/sign-in` when there's no session.
- `app/(app)/(tabs)/` — main tab navigator. Tab bar is a custom `SimpleTabBar` component, not the default.

### Features (`features/`)
All real logic. Each feature follows a fixed subfolder convention — see `features/CLAUDE.md` for the rule (`components/`, `utils/`, `hooks/`, `screens/`, optional `flowFile.tsx`).

The **flow file** pattern (e.g. `features/home/homeFlow.tsx`, `features/upload/uploadFlow.tsx`) is how multi-step features are wired together: a flow file owns the screen sequence via `useScreenSequence` (`features/shared/hooks/useScreenState.ts`) and conditionally renders one screen at a time. The corresponding `app/` route just renders the flow component. New multi-step features should follow this pattern instead of pushing routes.

### Auth (`features/auth/AuthProvider.tsx`)
Single `AuthContext` that owns session/user state and exposes `signInWithPassword`, `signUpWithPassword`, `signInWithGoogle`, `signInWithApple`, `signOut`, `removeAccount`. Subscribes to `supabase.auth.onAuthStateChange` and also listens for `Linking` URLs to complete OAuth (Google flow returns via deep link to scheme `trueswing`). Apple sign-in is only rendered on iOS.

### Backend API (`lib/apiClient.ts`)
All calls to the backend go through `apiClient` (`get/post/patch/put/delete`). It pulls the current Supabase access token, attaches `Authorization: Bearer …`, and throws a typed `ApiError` (`lib/errors.ts`) with status + code on failure. Base URL comes from `EXPO_PUBLIC_API_URL`. Feature `services/` files (e.g. `features/analysis/services/analysisService.ts`) wrap this client — do not call `fetch` directly from hooks/components.

### Styling
**NativeWind v4** + Tailwind. `global.css` is imported once in `app/_layout.tsx`. Babel uses `babel-preset-expo` with `jsxImportSource: 'nativewind'` and the NativeWind preset. Metro config wraps the Expo config with `withNativeWind(..., { input: './global.css' })`. Use `className=` on React Native components.

### Path aliases
`app.json` enables `experiments.tsconfigPaths: true`, so bare imports like `lib/supabase`, `features/auth/AuthProvider`, `features/shared/...` are resolved from project root. There is **no `@/` prefix** in actual use — match the existing style.

### Native modules
- `modules/expo-fast-seek/` — local Expo module (`FastSeek`) with iOS (Swift) + Android (Kotlin) implementations. Exposes `seekKeyframe(viewTag, posMs)` / `seekPrecise(viewTag, posMs)` to JS for low-latency video scrubbing in `features/scrubber`. Falls back gracefully via `requireOptionalNativeModule`.
- `react-native-video-trim`, `expo-video`, `expo-camera`, `expo-image-picker` are central to the upload/trim/scrubber flows.
- `react-native-worklets/plugin` is enabled in Babel (for Reanimated/gesture worklets).

### Environment
Required env vars (prefix with `EXPO_PUBLIC_` so Expo exposes them to the client):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_URL`

## Conventions
- Light commenting on non-obvious code only.
- Files in `features/*/components/` should stay under ~200 lines (see `features/CLAUDE.md`).
- File names start with a capital letter inside `features/` (per `features/CLAUDE.md`); route files in `app/` follow expo-router's lowercase convention.
- When you add or remove a native plugin/permission or change anything in `app.json`, run `expo prebuild` and rebuild — the `ios/` and `android/` folders are checked in but regenerated.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
