# features/

Real UI lives here. `app/` is only a thin routing layer.

## Rules

- **One feature = one leaf page.** Current features: `business`, `users`,
  `db-objects`.
- A feature owns its `pages/`, `hooks/`, and `components/`. It knows **nothing**
  about routing — no `usePathname`, no `<Link>` to sibling routes, no layout
  chrome.
- Route files in `app/` are one line: `export { default } from
  "@/features/<name>/pages/<Page>";`
- Navigation chrome (top tabs, sidebar) is **not** a feature. It lives in the
  `app/` layouts (`app/(dashboard)/**/_components/`).
- Cross-feature UI (e.g. `EmptyPage`) lives in `@/components/`, not in a feature.

## Adding a screen

1. `features/<name>/pages/<Name>Page.tsx` — the component.
2. `app/(dashboard)/.../<name>/page.tsx` — the one-line re-export.
3. Add a nav entry (top tab or sidebar item) in the relevant `_components`.

`@/*` maps to the project root, so `@/features/...` and `@/components/...`
resolve everywhere.

## features/ vs lib/

`features/` is UI and pure **view** helpers. It never talks to the API directly.

- Data access, auth, tokens, the TrueSwing API client → `lib/<domain>/` (see
  `lib/README.md`). A page/action calls a `lib` function that returns a
  `FetchResult` / `MutationResult`, then renders it.
- View helpers that only shape data for display (`format.ts`, `paginate.ts`) or
  decide how something looks (`shared/utils/is-active.ts`) stay here — they take
  plain data in and return plain data/JSX out, no `fetch`, no token.

Rule of thumb: if it takes a token or hits the network, it belongs in `lib/`.
