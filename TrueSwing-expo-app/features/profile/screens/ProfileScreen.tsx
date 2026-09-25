import { useCallback } from 'react';
import { FlatList, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { useAuth } from 'features/auth/AuthProvider';
import useAnalyses from 'features/analysis/hooks/useAnalyses';
import Avatar from 'features/shared/components/Avatar';
import LoadingState from 'features/shared/components/LoadingState';
import ErrorState from 'features/shared/components/ErrorState';
import MenuButton from 'features/profile/components/MenuButton';
import SwingTile from 'features/profile/components/SwingTile';
import SwingGridEmpty from 'features/profile/components/SwingGridEmpty';

const GUTTER = 20;
const GAP = 8;
const COLUMNS = 2;

export default function ProfileScreen() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { allAnalyses, loading, error, refetch } = useAnalyses();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const tileWidth = (width - GUTTER * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

  if (authLoading) {
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

      <FlatList
        data={allAnalyses}
        keyExtractor={(item) => item.analysis_id}
        numColumns={COLUMNS}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 120 }}
        columnWrapperStyle={{ gap: GAP }}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
        ListHeaderComponent={
          <View className="pb-8 pt-4">
            <View className="flex-row items-center">
              <Avatar
                photoURL={user.photoURL}
                name={user.name}
                email={user.email}
                size={80}
                shape="circle"
              />
              {/* `flex-1` so a long name wraps inside the row instead of pushing the
                  avatar off the left edge. */}
              <Text className="ml-4 flex-1 font-display text-[27px] leading-[32px] text-sand">
                {user.name || 'User'}
              </Text>
            </View>

            {allAnalyses.length ? (
              <Text className="mt-9 text-center font-sans-semibold text-[11px] uppercase tracking-[2.5px] text-sand-dim">
                Your swings
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <SwingGridEmpty
            loading={loading}
            error={error}
            onRetry={refetch}
            onUpload={() => router.push('/add-focus/upload')}
          />
        }
        renderItem={({ item }) => (
          <SwingTile
            analysis={item}
            width={tileWidth}
            onPress={() => router.push(`/swings?id=${item.analysis_id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}
