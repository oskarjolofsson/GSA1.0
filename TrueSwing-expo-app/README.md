# TrueSwing Mobile App

The TrueSwing iOS and Android app, built with Expo and React Native.

## Prerequisites

- Node.js 20+
- Xcode (for iOS) / Android Studio (for Android)

**Expo Go will not work.** This app depends on native modules and config plugins
(`expo-camera`, `react-native-video-trim`, `react-native-purchases`, Google
Sign-In), so you need a development build on your simulator or device. The setup
steps below produce one.

## Setup

```bash
cd TrueSwing-expo-app
npm install

# Regenerate native projects if ios/ or android/ are missing or stale
npx expo prebuild

npm run ios       # builds and launches on iOS
npm run android   # builds and launches on Android
```

`npm run ios` / `npm run android` are `expo run:*` — full native builds. The
first one takes a while; after that, `npm start` boots just the dev server and
connects to the dev client you already installed.

## Environment variables

Create a `.env` in this directory:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

EXPO_PUBLIC_API_URL=

EXPO_PUBLIC_RC_APPLE_KEY=
EXPO_PUBLIC_RC_GOOGLE_KEY=
```

On a physical device, `EXPO_PUBLIC_API_URL` must be your machine's LAN IP
(e.g. `http://192.168.1.20:8000`), not `localhost` — `localhost` resolves to the
phone itself and every request fails against the wrong host.

## Common commands

```bash
npm test              # jest
npm run typecheck     # tsc --noEmit
npm run lint          # eslint + prettier check
npm run format        # eslint --fix + prettier --write
npm run gen:api-types # regenerate lib/api/schema.d.ts from the backend
```

`gen:api-types` reads the backend's `/openapi.json`, so the backend must be
running. Point it elsewhere with `TS_API_URL` (defaults to
`http://localhost:8000`).

## More docs

- [`CLAUDE.md`](CLAUDE.md) — project conventions
- [`TODOS.md`](TODOS.md)
- [`docs/billing-plan.md`](docs/billing-plan.md)
