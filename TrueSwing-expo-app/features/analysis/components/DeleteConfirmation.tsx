import React from "react";
import { Modal, View, Text, Pressable, Dimensions } from "react-native";
import { AlertCircle } from "lucide-react-native";

type DeleteConfirmationProps = {
    visible: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
};

export default function DeleteConfirmation({
    visible,
    onConfirm,
    onCancel,
    isLoading = false,
}: DeleteConfirmationProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View className="flex-1 bg-black/50 justify-center items-center">
                <View className="bg-slate-900 rounded-2xl p-6 mx-8 border border-white/10">
                    {/* Icon */}
                    <View className="items-center mb-4">
                        <AlertCircle size={48} color="#ef4444" />
                    </View>

                    {/* Title */}
                    <Text className="text-xl font-bold text-white text-center mb-2">
                        Delete Analysis?
                    </Text>

                    {/* Description */}
                    <Text className="text-sm text-zinc-300 text-center mb-6">
                        This action cannot be undone. You will lose all data associated with this analysis.
                    </Text>

                    {/* Buttons */}
                    <View className="flex-row gap-3">
                        <Pressable
                            onPress={onCancel}
                            disabled={isLoading}
                            className="flex-1 bg-white/10 rounded-lg py-3"
                        >
                            <Text className="text-white font-semibold text-center">
                                Cancel
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={onConfirm}
                            disabled={isLoading}
                            className="flex-1 bg-red-600 rounded-lg py-3"
                        >
                            <Text className="text-white font-semibold text-center">
                                {isLoading ? "Deleting..." : "Delete"}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
