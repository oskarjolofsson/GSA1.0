import { useCallback } from "react";
import { View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import UploadFlow from "features/upload/uploadFlow";
import { useRequirePremium } from "features/billing/hooks/useRequirePremium";

export default function Upload() {
  const router = useRouter();
  const { requirePremium } = useRequirePremium();

  // Premium entry-point gate: if blocked, pop the paywall and bounce to home.
  useFocusEffect(
    useCallback(() => {
      requirePremium(() => router.replace("/(app)/(tabs)"));
    }, [requirePremium, router])
  );

  return (
    <View style={{ flex: 1 }}>
      <UploadFlow />
    </View>
  );
}
