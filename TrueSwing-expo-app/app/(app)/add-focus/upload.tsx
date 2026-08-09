import { View } from 'react-native';
import { useRouter } from 'expo-router';

import UploadFlow from 'features/upload/UploadFlow';
import { exitToHome } from 'features/shared/utils/exitToHome';
import { useRequirePremiumEntry } from 'features/billing/hooks/useRequirePremiumEntry';

/**
 * A ROUTE, NOT DRAWER CONTENT. `useRequirePremiumEntry` gates on route focus, and
 * opening a drawer does not blur the screen behind it — so rendering this flow
 * inside the drawer would silently skip the paywall. See the hook's own comment.
 */
export default function Upload() {
  useRequirePremiumEntry();
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <UploadFlow onCancel={() => exitToHome(router)} />
    </View>
  );
}
