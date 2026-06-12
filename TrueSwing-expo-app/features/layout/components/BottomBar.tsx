import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, BarChart2, Upload, User } from 'lucide-react-native';

type Tab = 'home' | 'analyses' | 'upload' | 'profile';

interface TabItem {
  key: Tab;
  label: string;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
}

const TABS: TabItem[] = [
  { key: 'home',     label: 'Home',     Icon: Home },
  { key: 'analyses', label: 'Analyses', Icon: BarChart2 },
  { key: 'upload',   label: 'Upload',   Icon: Upload },
  { key: 'profile',  label: 'Profile',  Icon: User },
];

export default function BottomTabBar() {
  const [active, setActive] = useState<Tab>('home');

  return (
    <SafeAreaView className="bg-gray-900" edges={['bottom']}>
      <View className="flex-row bg-gray-900 border-t border-gray-800 pt-2.5 pb-1 px-2">
        {TABS.map(({ key, label, Icon }) => {
          const isActive = active === key;
          const isUpload = key === 'upload';

          if (isUpload) {
            return (
              <TouchableOpacity
                key={key}
                className="flex-1 items-center justify-center gap-1"
                onPress={() => setActive(key)}
                activeOpacity={0.8}
              >
                <View
                  className={`w-12 h-12 rounded-xl items-center justify-center border ${
                    isActive
                      ? 'bg-sky-400 border-sky-400'
                      : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  <Icon
                    size={22}
                    color={isActive ? '#0a0f1a' : '#ffffff'}
                    strokeWidth={2}
                  />
                </View>
                <Text
                  className={`text-[11px] font-medium tracking-wide ${
                    isActive ? 'text-sky-400' : 'text-gray-600'
                  }`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={key}
              className="flex-1 items-center justify-center gap-1"
              onPress={() => setActive(key)}
              activeOpacity={0.75}
            >
              <View className="w-11 h-9 items-center justify-center relative">
                {isActive && (
                  <View className="absolute inset-0 rounded-xl bg-sky-400/10" />
                )}
                <Icon
                  size={22}
                  color={isActive ? '#38bdf8' : '#4b5563'}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </View>
              <Text
                className={`text-[11px] font-medium tracking-wide ${
                  isActive ? 'text-sky-400' : 'text-gray-600'
                }`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}