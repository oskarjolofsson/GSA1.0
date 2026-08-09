import { exitToHome } from './exitToHome';

/**
 * Leaving an add-focus route. Four cases, and three of them are the ones that
 * bite: the deep-link entry with no stack underneath, and the two area handoffs.
 *
 * WHY `back` VS `dismissTo` MATTERS ENOUGH TO TEST. Both pop to the same still-
 * mounted home screen, which is what preserves `selectedArea` (see the comment at
 * `features/home/homeFlow.tsx:38`). Only `dismissTo` can carry `?area=`. If someone
 * "simplifies" this to `replace('/')`, home remounts and the golfer loses the area
 * they had open on every single add — silently, with nothing failing.
 */
function makeRouter(canGoBack: boolean) {
  return {
    canGoBack: jest.fn(() => canGoBack),
    back: jest.fn(),
    replace: jest.fn(),
    dismissTo: jest.fn(),
  };
}

type Router = Parameters<typeof exitToHome>[0];

describe('exitToHome', () => {
  it('pops back when there is a stack and no area', () => {
    const router = makeRouter(true);
    exitToHome(router as unknown as Router);

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
    expect(router.dismissTo).not.toHaveBeenCalled();
  });

  it('dismisses to home carrying the area when one is known', () => {
    const router = makeRouter(true);
    exitToHome(router as unknown as Router, 'PUTTING');

    expect(router.dismissTo).toHaveBeenCalledWith('/?area=PUTTING');
    // Not back(): back() cannot pass params, so the area would be dropped.
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('replaces to home when opened cold with no stack underneath', () => {
    const router = makeRouter(false);
    exitToHome(router as unknown as Router);

    // A bare back() here is a no-op: the golfer taps Done and nothing happens.
    expect(router.replace).toHaveBeenCalledWith('/');
    expect(router.back).not.toHaveBeenCalled();
  });

  it('replaces with the area when opened cold and an area is known', () => {
    const router = makeRouter(false);
    exitToHome(router as unknown as Router, 'BUNKER');

    expect(router.replace).toHaveBeenCalledWith('/?area=BUNKER');
  });

  it('treats a null area as no area rather than sending "null"', () => {
    const router = makeRouter(true);
    exitToHome(router as unknown as Router, null);

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.dismissTo).not.toHaveBeenCalled();
  });
});
