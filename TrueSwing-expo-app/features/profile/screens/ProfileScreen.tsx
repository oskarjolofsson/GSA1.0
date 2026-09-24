import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuth } from 'features/auth/AuthProvider';
import Avatar from 'features/shared/components/Avatar';
import LoadingState from 'features/shared/components/LoadingState';
import ErrorState from 'features/shared/components/ErrorState';
import MenuButton from 'features/profile/components/MenuButton';

export default function ProfileScreen() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  if (loading) {
    return <LoadingState title="Loading profile" subtitle="Please wait a moment" />;
  }

  if (!user) {
    return (
      <ErrorState
        title="Not authenticated"
        message="Please log in to view your profile."
        buttonText="Go to login"
        onRetry={() => {
          signOut();
        }}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-ink" edges={['top']}>
      <View className="flex-row justify-end px-6 pt-2">
        <MenuButton onPress={() => router.push('/settings')} />
      </View>

      <View className="flex-1 items-center justify-center px-6 pb-24">
        <Avatar
          photoURL={user.photoURL}
          name={user.name}
          email={user.email}
          size={104}
          shape="circle"
        />

        <Text className="mt-7 text-center font-display text-[29px] leading-[34px] text-sand">
          {user.name || 'User'}
        </Text>
      </View>
    </SafeAreaView>
  );
}
