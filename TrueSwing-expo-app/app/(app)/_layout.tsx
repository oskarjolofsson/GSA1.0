import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "features/auth/AuthProvider";

export default function AppLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(public)/sign-in" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}