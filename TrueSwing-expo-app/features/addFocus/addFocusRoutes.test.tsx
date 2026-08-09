import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * THE PAYWALL REGRESSION GUARD. This is the one failure in the tabless-drawer
 * change that is completely invisible: `useRequirePremiumEntry` fires on ROUTE
 * focus, and opening a drawer does NOT blur the screen behind it. Move any of
 * these flows into `AddFocusDrawer` as inline content, or drop the hook call while
 * refactoring a route, and free golfers walk straight into upload — no error, no
 * log, nothing failing.
 *
 * WHY THIS READS SOURCE INSTEAD OF RENDERING THE ROUTES. Jest mangles paths
 * containing expo-router's `(group)` parentheses — importing
 * `app/(app)/add-focus/upload` yields a second module-registry entry, so mocks
 * registered by the test are not the ones the route resolves. The symptom is a
 * mock that provably runs while `toHaveBeenCalled()` reports zero. A source scan
 * sidesteps the resolver entirely.
 *
 * It is also the stronger assertion: it covers every file in the directory,
 * including routes nobody has written yet, rather than three hardcoded imports.
 */

const ADD_FOCUS_DIR = join(__dirname, '..', '..', 'app', '(app)', 'add-focus');

function routeFiles(): string[] {
  return readdirSync(ADD_FOCUS_DIR).filter(
    (f) => f.endsWith('.tsx') && !f.startsWith('_') && !f.includes('.test.')
  );
}

describe('add-focus routes', () => {
  it('has routes to check (guards against the directory being moved)', () => {
    // Without this, renaming the directory would make every assertion below
    // vacuously pass over an empty list.
    expect(routeFiles().sort()).toEqual(['browse.tsx', 'coach.tsx', 'upload.tsx']);
  });

  it.each(routeFiles())('%s calls useRequirePremiumEntry', (file) => {
    const src = readFileSync(join(ADD_FOCUS_DIR, file), 'utf8');

    expect(src).toContain(
      "import { useRequirePremiumEntry } from 'features/billing/hooks/useRequirePremiumEntry'"
    );
    expect(src).toMatch(/useRequirePremiumEntry\(\);/);
  });

  it.each(routeFiles())('%s leaves via exitToHome, never a bare replace', (file) => {
    const src = readFileSync(join(ADD_FOCUS_DIR, file), 'utf8');

    expect(src).toContain('exitToHome');
    // A bare replace('/') would remount HomeFlow and discard `selectedArea` —
    // see the comment at features/home/homeFlow.tsx:38.
    expect(src).not.toMatch(/router\.replace\(['"]\/['"]\)/);
  });
});
