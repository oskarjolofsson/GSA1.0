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
