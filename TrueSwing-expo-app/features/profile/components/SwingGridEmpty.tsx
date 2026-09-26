import { Text, View } from 'react-native';

import Button from 'features/shared/components/Button';

/** Empty, failed and still-loading are three different sentences. DESIGN.md: an empty
 *  state names the thing, says one honest sentence about why, and gives one way out --
 *  and "say the true thing" means a failed fetch must not read as "you have no swings". */
type Props = {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onUpload: () => void;
};

export default function SwingGridEmpty({ loading, error, onRetry, onUpload }: Props) {
  if (loading) {
    return (
      <View className="items-center py-16">
        <Text className="text-[13px] text-sand-dim">Loading your swings</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center py-14">
        <Text className="font-display text-[18px] text-sand">Couldn&apos;t load your swings</Text>
        <Text className="mt-2 max-w-[280px] text-center text-[13px] leading-5 text-sand-dim">
          {error.includes('connect')
            ? 'Check your internet connection and try again.'
            : 'Something went wrong on our side.'}
        </Text>
        <View className="mt-6">
          <Button label="Try again" onPress={onRetry} tone="outline" />
        </View>
      </View>
    );
  }

  return (
    <View className="items-center py-14">
      <Text className="font-display text-[18px] text-sand">No swings yet</Text>
      <Text className="mt-2 max-w-[280px] text-center text-[13px] leading-5 text-sand-dim">
        Film or upload a swing and it shows up here.
      </Text>
      <View className="mt-6">
        <Button label="Upload a swing" onPress={onUpload} tone="outline" />
      </View>
    </View>
  );
}
