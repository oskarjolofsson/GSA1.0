import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WifiOff } from 'lucide-react-native';

import { useConnectivity } from 'features/shared/connectivity/ConnectivityContext';

/**
 * Thin app-wide bar shown whenever the device is offline. Renders nothing when
 * online. Positioned as an absolute top overlay so it floats over content
 * instead of pushing the layout down (no reflow when connectivity flips). Adds
 * the top safe-area inset so the bar clears the status bar / notch.
 */
export default function OfflineBanner() {
  const { isOffline } = useConnectivity();
  const insets = useSafeAreaInsets();

  if (!isOffline) return null;

  return (
    <View
      style={{
        paddingTop: insets.top,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
      }}
      className="flex-row items-center justify-center bg-red-500/90 px-4 pb-2">
      <WifiOff size={14} color="#ffffff" />
      <Text className="ml-2 text-sm font-medium text-white">{"You're offline"}</Text>
    </View>
  );
}
