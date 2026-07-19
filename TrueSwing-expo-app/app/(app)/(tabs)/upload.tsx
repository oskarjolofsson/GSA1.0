import { View } from "react-native";
import AddFocusFlow from "features/addFocus/AddFocusFlow";
import { useRequirePremiumEntry } from "features/billing/hooks/useRequirePremiumEntry";

export default function Upload() {
  useRequirePremiumEntry();

  return (
    <View style={{ flex: 1 }}>
      <AddFocusFlow />
    </View>
  );
}
