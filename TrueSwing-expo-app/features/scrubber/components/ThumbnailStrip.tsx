import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { BAR_H, FRAME_COUNT } from '../utils/constants';

interface Props {
  frames: Array<string | null>;
  trackW: number;
  placeholderColor?: string;
}

// Pure layout component — no animation, no gesture. Re-renders only when frames
// or trackW change (i.e. when thumbnails resolve or screen rotates).
const ThumbnailStrip = ({ frames, trackW, placeholderColor = '#1A1A1A' }: Props) => {
  return (
    <View pointerEvents="none" style={[s.row, { height: BAR_H, width: trackW || '100%' }]}>
      {Array.from({ length: FRAME_COUNT }).map((_, i) => (
        <View key={i} style={s.cell}>
          {frames[i] ? (
            <Image source={{ uri: frames[i]! }} style={s.img} resizeMode="cover" />
          ) : (
            <View style={[s.placeholder, { backgroundColor: placeholderColor }]} />
          )}
        </View>
      ))}
    </View>
  );
};

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  cell: {
    flex: 1,
    overflow: 'hidden',
    borderRightWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  img: { width: '100%', height: '100%' },
  placeholder: { flex: 1 },
});

export default React.memo(ThumbnailStrip);
