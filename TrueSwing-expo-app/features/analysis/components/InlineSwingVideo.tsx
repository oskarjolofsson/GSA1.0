import { Pressable, View } from 'react-native';
import { VideoView, type VideoSource } from 'expo-video';
import { Play } from 'lucide-react-native';

import useReelPlayback from '../hooks/useReelPlayback';
import useScrubFriendlyVideo from '../hooks/useScrubFriendlyVideo';
import VideoSeekBar from './VideoSeekBar';
import colors from 'lib/colors';

type Props = {
  videoURL: string | null;
  analysisId: string | null;
  active: boolean;
};

/**
 * The golfer's own swing, pause/scrub-able like the drawing-mode video
 * (DetailedVideo.tsx) -- same useReelPlayback + VideoSeekBar pairing, same
 * useScrubFriendlyVideo prep (dense-keyframe re-encode on Android so scrub
 * isn't choppy; iOS scrubs the remote URL directly). The box itself keeps its
 * exact size/shape (height:'100%' of its flex:1 parent, 9:16 aspect) --
 * play/pause and the seek bar are overlays on top of it, not changes to it.
 */
export default function InlineSwingVideo({ videoURL, analysisId, active }: Props) {
  const { uri: playableUri } = useScrubFriendlyVideo(analysisId, videoURL);
  const source: VideoSource | null = playableUri ?? null;
  const playback = useReelPlayback({ source, shouldPlay: active, muted: true, loop: true });

  return (
    <View style={{ flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{ height: '100%', aspectRatio: 9 / 16 }}
        className="overflow-hidden rounded-[20px] border border-sand/10 bg-ink-raised"
      >
        {source ? (
          <Pressable
            onPress={playback.togglePlayPause}
            style={{ flex: 1 }}
            accessibilityRole="button"
            accessibilityLabel={playback.isPlaying ? 'Pause video' : 'Play video'}
          >
            <VideoView
              player={playback.player}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              nativeControls={false}
            />

            {!playback.isPlaying ? (
              <View
                pointerEvents="none"
                className="absolute inset-0 items-center justify-center"
              >
                <View className="h-12 w-12 items-center justify-center rounded-full bg-black/50">
                  <Play size={20} color={colors.sand} fill={colors.sand} />
                </View>
              </View>
            ) : null}

            <View className="absolute bottom-2 left-2 right-2">
              <VideoSeekBar
                currentTime={playback.currentTime}
                duration={playback.duration}
                isPlaying={playback.isPlaying}
                onSeekStart={playback.beginScrub}
                onSeekChange={(time) => playback.updateScrub(time, true)}
                onSeekComplete={(time) => playback.endScrub(time)}
              />
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
