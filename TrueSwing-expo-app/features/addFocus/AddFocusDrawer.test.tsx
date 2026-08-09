import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';

import AddFocusDrawer from './AddFocusDrawer';

/**
 * The drawer's whole job is turning three taps into three route pushes.
 *
 * CLOSE-THEN-PUSH IS THE CONTRACT, NOT AN IMPLEMENTATION DETAIL. Leaving the
 * drawer open across the push leaves it sitting over the pushed screen, and the
 * close animation is also what makes a second tap land on nothing. Both assertions
 * below check the pair fired, in that order.
 *
 * The routes matter as much as the taps: these three flows are gated by
 * `useRequirePremiumEntry`, which fires on ROUTE focus. If a future change swaps a
 * push for inline drawer content, the paywall stops firing with nothing throwing.
 */

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// The drawer reads the top inset to clear the notch, so it needs a provider.
// Fixed metrics rather than the device's: the assertions are about content, and a
// varying inset would make them depend on which simulator ran the suite.
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

async function renderDrawer() {
  const closeDrawer = jest.fn();
  const props = { navigation: { closeDrawer } } as unknown as DrawerContentComponentProps;
  const view = await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <AddFocusDrawer {...props} />
    </SafeAreaProvider>
  );
  return { closeDrawer, view };
}

beforeEach(() => {
  mockPush.mockClear();
});

describe('AddFocusDrawer', () => {
  it('offers exactly the three ways to start a focus', async () => {
    const { view } = await renderDrawer();

    expect(view.getByText('Start a focus')).toBeTruthy();
    expect(view.getByText('Browse the library')).toBeTruthy();
    expect(view.getByText('Upload a swing')).toBeTruthy();
    expect(view.getByText('Coach feedback')).toBeTruthy();
  });

  it.each([
    ['Browse the library', '/add-focus/browse'],
    ['Upload a swing', '/add-focus/upload'],
    ['Coach feedback', '/add-focus/coach'],
  ])('%s closes the drawer and pushes %s', async (label, href) => {
    const { closeDrawer, view } = await renderDrawer();

    await fireEvent.press(view.getByText(label));

    expect(closeDrawer).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(href);
  });

  it('keeps the subtitles to one line at drawer width', async () => {
    const { view } = await renderDrawer();

    // 34 chars is what fits on one line at 13px in a 300px drawer minus the icon
    // gutter. The originals were written for a full-width screen and wrapped to
    // four or five lines each, which is the wall of text this replaced.
    for (const subtitle of [
      'Pick what to work on',
      'Let AI find your misses',
      'Turn a lesson into a plan',
    ]) {
      expect(view.getByText(subtitle)).toBeTruthy();
      expect(subtitle.length).toBeLessThanOrEqual(34);
    }
  });
});
