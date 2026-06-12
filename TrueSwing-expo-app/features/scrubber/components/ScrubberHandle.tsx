import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { BAR_H, HW } from '../utils/constants';

interface Props {
  side: 'left' | 'right';
  // For left handle, this is pxL. For right, this is pxR — the handle is drawn so its right edge sits on pxR.
  position: SharedValue<number>;
  color?: string;
  iconColor?: string;
}

const ScrubberHandle = ({ position, side, color = '#FFFFFF', iconColor = '#1C1C1E' }: Props) => {
  const style = useAnimatedStyle(() => ({
    left: side === 'left' ? position.value : position.value - HW,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          width: HW,
          height: BAR_H,
          zIndex: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: color,
        },
        style,
      ]}
    >
      <Ionicons name={side === 'left' ? 'chevron-back' : 'chevron-forward'} size={13} color={iconColor} />
    </Animated.View>
  );
};

export default React.memo(ScrubberHandle);
