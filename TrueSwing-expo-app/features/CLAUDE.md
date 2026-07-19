# FEATURES DIRECTORY

## What this folder is and layout
In here all logic and core features are written. In each feature-folder there are the following subfolders: 
- components - strictly design related
- utils - simple functions to store in other places than the components.
- hooks - Where states are stored. Try to keep the helper functions in utils
- screens - the files that are used in the routes, the `/app` directory

A flow-file might also be used, to determine which screen is showed at a given time


## Conventions
- **File naming.** Screens, components, and flow files are PascalCase
  (`AnalysisResultScreen.tsx`, `GreenCheck.tsx`, `HomeFlow.tsx`). Hooks and utils
  keep their `useX`/camelCase names (`useActivity.ts`, `activityStats.ts`), and
  `types.ts` / `index.ts` stay lowercase. A screen or flow file named in
  lowercase is a bug — rename it.
- **One hook = one concern.** If a hook's name needs an "and" to describe it, split it. Avoid umbrella `useXActions` hooks that bundle multiple subsystems — each consumer should depend only on what it uses.
- **One service = one domain entity.** Session lifecycle, drill catalog CRUD, and drill-run execution each get their own service file. Cross-domain types may be imported, but cross-domain functions belong in separate services.
- **Flow files use a domain-named flow hook, not `useScreenSequence` directly.** Each multi-step feature defines a `useXFlowSequence` wrapper that exposes named transitions (`goToResult()`, `goToTrimVideo()`) instead of raw step strings. The shared `useScreenSequence` primitive stays a primitive.
- **Keep `screens` arrays at module scope** in flow sequence hooks. A new array literal on every render destabilizes downstream `useCallback` identities and can cause `useFocusEffect`/`useEffect` to re-fire unexpectedly.



## What to avoid
- To component files, no files should be longer than 200 lines