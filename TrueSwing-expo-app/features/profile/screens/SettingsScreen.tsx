import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

import { useAuth } from 'features/auth/AuthProvider';
import SubscriptionBanner from 'features/billing/components/SubscriptionBanner';
import SubscriptionCard from 'features/billing/components/SubscriptionCard';
import SupportCard from 'features/profile/components/SupportCard';
import AccountActions from 'features/profile/components/AccountActions';
import colors from 'lib/colors';

/**
 * Pushed as a route on the `(app)` stack rather than shown inside the
 * tab, so it covers the tab bar and gets a real back gesture.
 */
export default function SettingsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-ink">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Settings',
          headerBackButtonDisplayMode: 'minimal',
          headerTintColor: colors.sand,
          headerTitleStyle: { color: colors.sand, fontFamily: 'Fraunces_600SemiBold' },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.ink },
        }}
      />

      <ScrollView
        contentContainerStyle={{
          paddingTop: 20,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 48,
        }}
        showsVerticalScrollIndicator={false}>
        <SubscriptionBanner />

        {/* Account */}
        <Text className="font-display text-[18px] text-sand">Account</Text>
        <View className="mt-4 min-h-[44px] justify-center border-b border-t border-[rgba(232,220,196,0.13)] py-3.5">
          <Text className="text-[13px] text-sand-dim">Email address</Text>
          <Text className="mt-1 text-[15px] text-sand">{user?.email || 'No email'}</Text>
        </View>

        <View className="mt-11">
          <SubscriptionCard />
        </View>

        <View className="mt-11">
          <SupportCard />
        </View>

        <View className="mt-11">
          <AccountActions />
        </View>
      </ScrollView>
    </View>
  );
}
