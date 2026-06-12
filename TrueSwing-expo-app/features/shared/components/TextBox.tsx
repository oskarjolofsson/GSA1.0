import React from "react";
import { View, Text, Pressable } from "react-native";

type TextBoxProps = {
  header?: string;
  text?: string;
  ctaOnClick?: () => void;
  ctaText?: string;
  redCTA?: boolean;
  className?: string;
};

export default function TextBox({
  header,
  text,
  ctaOnClick,
  ctaText,
  redCTA = false,
  className = "",
}: TextBoxProps) {
  return (
    <View className={`w-full px-3 mt-10 mb-6 ${className}`}>
      <View className="rounded-3xl border border-white/10 bg-[#0e1428]/90 px-4 py-5 shadow-lg">
        {header ? (
          <Text className="mb-3 text-xl font-bold text-white">
            {header}
          </Text>
        ) : null}

        {text ? (
          <Text className="leading-6 text-slate-300">
            {text}
          </Text>
        ) : null}

        {ctaOnClick && ctaText ? (
          <View className="mt-5">
            <Pressable
              onPress={ctaOnClick}
              className={`self-start rounded-xl px-5 py-3 ${
                redCTA ? "bg-red-600" : "bg-emerald-600"
              } active:opacity-80`}
            >
              <Text className="text-sm font-medium text-white">{ctaText}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}