import { Modal, View, Text, TouchableOpacity } from "react-native";

type AiConsentModalProps = {
  visible: boolean;
  onAccept: () => void;
  onCancel: () => void;
};

export function AiConsentModal({
  visible,
  onAccept,
  onCancel,
}: AiConsentModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center px-5">
        <View className="bg-white rounded-3xl p-6">
          <Text className="text-xl font-bold text-zinc-950 mb-3">
            AI Analysis Consent
          </Text>

          <Text className="text-zinc-700 mb-4 leading-6">
            TrueSwing uses Google Gemini, a third-party AI service provided by
            Google, to analyze your golf swing.
          </Text>

          <Text className="text-zinc-700 mb-4 leading-6">
            To create your analysis, we send your uploaded swing video and
            analysis instructions/prompts to Google Gemini. We do not send your
            name, email, payment information, contacts, or precise location.
          </Text>

          <Text className="text-zinc-700 mb-6 leading-6">
            Gemini processes the video to generate swing feedback and practice
            suggestions. By continuing, you consent to this data being sent to
            Google Gemini for AI analysis.
          </Text>

          <TouchableOpacity
            onPress={onAccept}
            className="bg-zinc-950 rounded-2xl py-4 mb-3"
          >
            <Text className="text-white text-center font-semibold">
              I agree and analyze
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancel} className="py-3">
            <Text className="text-zinc-600 text-center font-medium">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}