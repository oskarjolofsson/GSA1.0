/**
 * The two navigation callbacks a screen in a flow may take.
 *
 * Both are OPTIONAL. They were previously written `onNext: () => void | undefined`, which
 * types the *return value* as `void | undefined` and leaves the prop itself required --
 * so screens that navigate one way only were forced to pass `onNext={() => {}}` no-ops,
 * and those no-ops then read as oversights rather than as a type working correctly.
 */
export interface ScreenProps {
  onNext?: () => void;
  onBack?: () => void;
}
