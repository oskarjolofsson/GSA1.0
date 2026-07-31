import {
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Image,
  Linking,
  ScrollView,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

type Props = {
  onGoogleButtonPress: () => Promise<void>;
  onAppleButtonPress: () => Promise<void>;
  onEmailButtonPress: () => void;
  submitting?: boolean;
  error?: string | null;
};

export default function LandingScreen({
  onGoogleButtonPress,
  onEmailButtonPress,
  onAppleButtonPress,
  submitting,
  error,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView className="flex-1 bg-[#09090b]">
      <StatusBar barStyle="light-content" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: insets.bottom + 28,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-between">
          {/* Logo */}
          <View className="items-center justify-center flex-1">
            <Image
              source={require("../../../assets/true_swing_logo2.png")}
              style={{
                width: "80%",
                height: 180,
              }}
              resizeMode="contain"
            />
          </View>

          {/* Buttons */}
          <View>
            <TouchableOpacity
              onPress={onGoogleButtonPress}
              disabled={submitting}
              activeOpacity={0.75}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffffff",
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 24,
                opacity: submitting ? 0.6 : 1,
                shadowColor: "#ffffff",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.08,
                shadowRadius: 20,
              }}
            >
              <View
                className="absolute left-5 w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: "#f1f3f4" }}
              >
                <FontAwesome name="google" size={18} color="#4285F4" />
              </View>

              <Text
                style={{
                  color: "#111111",
                  fontSize: 16,
                  fontWeight: "600",
                  letterSpacing: 0.1,
                }}
              >
                {submitting ? "Signing in..." : "Continue with Google"}
              </Text>
            </TouchableOpacity>

            {Platform.OS === "ios" && (
              <TouchableOpacity
                onPress={onAppleButtonPress}
                disabled={submitting}
                activeOpacity={0.75}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#ffffff",
                  borderRadius: 16,
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  opacity: submitting ? 0.6 : 1,
                  shadowColor: "#ffffff",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.08,
                  shadowRadius: 20,
                  marginTop: 16,
                }}
              >
                <View
                  className="absolute left-5 w-9 h-9 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#f1f3f4" }}
                >
                  <FontAwesome name="apple" size={18} color="#111111" />
                </View>

                <Text
                  style={{
                    color: "#111111",
                    fontSize: 16,
                    fontWeight: "600",
                    letterSpacing: 0.1,
                  }}
                >
                  {submitting ? "Signing in..." : "Continue with Apple"}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={onEmailButtonPress}
              disabled={submitting}
              activeOpacity={0.75}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffffffaf",
                borderRadius: 16,
                paddingVertical: 16,
                paddingHorizontal: 24,
                opacity: submitting ? 0.6 : 1,
                shadowColor: "#ffffff",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.08,
                shadowRadius: 20,
                marginTop: 16,
              }}
            >
              <View
                className="absolute left-5 w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: "#f1f3f4" }}
              >
                <FontAwesome name="envelope" size={18} color="#79a6f0" />
              </View>

              <Text
                style={{
                  color: "#111111",
                  fontSize: 16,
                  fontWeight: "600",
                  letterSpacing: 0.1,
                }}
              >
                {submitting ? "Signing in..." : "Continue with Email"}
              </Text>
            </TouchableOpacity>

            {error ? (
              <Text className="text-red-400 text-center mt-4 text-sm">
                {error}
              </Text>
            ) : null}

            <Text
              className="text-zinc-600 text-center mt-6"
              style={{ fontSize: 12 }}
            >
              By continuing, you agree to our{" "}
              <Text
                className="text-blue-400 underline"
                onPress={() =>
                  Linking.openURL(
                    "https://trueswing.se/legal/terms-and-conditions"
                  )
                }
              >
                Terms
              </Text>{" "}
              &{" "}
              <Text
                className="text-blue-400 underline"
                onPress={() =>
                  Linking.openURL("https://trueswing.se/legal/privacy-policy")
                }
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}