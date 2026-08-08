import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ErrorState from 'features/shared/components/ErrorState';
import { ScreenProps } from 'features/shared/types';

import { AnalysisStatusResponse } from '../types';
import { UploadProps } from '../hooks/useUpload';
import AnalysisComplete from '../components/AnalysisComplete';
import ProgressRail, { type RailStep } from '../components/ProgressRail';

type ProgressScreenProps = ScreenProps & {
  upload: UploadProps;
};

/** How often we ask the backend whether the analysis has finished. Analysis.status
 *  is coarse (processing -> completed | failed) so this is the only signal there is;
 *  3s keeps the screen responsive without hammering the API from a phone on 4G. */
const POLL_INTERVAL_MS = 3000;

const fmtMB = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/**
 * The wait. Two phases, and they are honest about being different:
 *
 *   Uploading  real bytes over real total, straight from the PUT task.
 *   Analysing  no percentage exists. Analysis.status has no sub-progress and the
 *              model does not report how far through it is, so the screen shows
 *              the stage and an estimate labelled as an estimate.
 *
 * The previous version ticked a 35-second timer to 100% and only then asked the
 * server anything, which meant the bar was unrelated to the work and regularly sat
 * at 100% while nothing had finished.
 */
export default function ProgressScreen({ onBack, onNext, upload }: ProgressScreenProps) {
  const [status, setStatus] = useState<AnalysisStatusResponse | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { phase, analysisId, sentBytes, totalBytes, checkAnalysisStatus } = upload;

  // Poll only once the bytes are up and the backend has something to work on.
  useEffect(() => {
    if (phase !== 'analysing' || !analysisId) return;

    let isActive = true;

    const poll = async () => {
      const result = await checkAnalysisStatus(analysisId);
      if (!isActive || !result) return;
      setStatus(result);
      if (result.status === 'completed' || result.status === 'failed') {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    };

    void poll();
    pollRef.current = setInterval(() => void poll(), POLL_INTERVAL_MS);

    return () => {
      isActive = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [phase, analysisId, checkAnalysisStatus]);

  if (upload.error) {
    return (
      <ErrorState
        message="That upload didn't go through. Your video is still on your phone — try again."
        onRetry={onBack}
      />
    );
  }

  if (status?.error_message) {
    return <ErrorState message={`Analysis failed: ${status.error_message}`} onRetry={onBack} />;
  }

  if (status?.status === 'completed') {
    // onNext, not a router.push from here: navigating straight out skipped
    // UploadFlow's own reset, so re-entering the tab landed on a stale flow
    // still holding the finished video.
    return <AnalysisComplete onNext={onNext} onBack={onBack} />;
  }

  // Byte counts are the one real number here, so they are shown only once they
  // are real — a "0.0 MB of 0.0 MB" line while the signed URL is being created
  // reads as broken.
  const hasBytes = totalBytes > 0;
  const uploadDetail = hasBytes
    ? phase === 'uploading'
      ? `${fmtMB(sentBytes)} of ${fmtMB(totalBytes)}`
      : `${fmtMB(totalBytes)} sent`
    : null;

  const steps: RailStep[] = [
    {
      key: 'upload',
      title: phase === 'uploading' || phase === 'preparing' ? 'Uploading' : 'Uploaded',
      detail: uploadDetail,
    },
    {
      key: 'analyse',
      title: 'Analysing',
      detail: 'Reading your swing frame by frame',
    },
    {
      key: 'program',
      title: 'Building your program',
    },
  ];

  const activeIndex = phase === 'analysing' ? 1 : 0;

  return (
    <SafeAreaView className="flex-1 bg-ink">
      <View className="flex-1 px-6 pt-16">
        <Text className="font-display text-[28px] leading-[34px] text-sand">
          Analysing your swing
        </Text>
        <Text className="mt-2 text-[13px] leading-[19px] text-sand-dim">
          Usually about 40 seconds. You can leave this screen open.
        </Text>

        <View className="mt-16">
          <ProgressRail steps={steps} activeIndex={activeIndex} />
        </View>
      </View>

      <View className="px-6 pb-6">
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          className="min-h-[44px] items-center justify-center active:opacity-70">
          <Text className="text-[13px] text-sand-dim">Cancel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
