import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "features/auth/AuthProvider";
import { BillingProvider } from "features/billing/BillingContext";
import HealthGate from "features/shared/components/HealthGate";
import IntroSelectionGate from "features/intro/components/IntroSelectionGate";

export default function AppLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  // The intro, not sign-in: it shows itself once per device and redirects here to
  // sign-in on every visit after that.
  if (!session) {
    return <Redirect href="/(public)/intro" />;
  }

  return (
    <BillingProvider>
      <HealthGate>
        {/* Inside HealthGate: starting the intro's focus is a request, and it
            should not be attempted before the backend is known reachable. */}
        <IntroSelectionGate>
          <Stack screenOptions={{ headerShown: false }} />
        </IntroSelectionGate>
      </HealthGate>
    </BillingProvider>
  );
}