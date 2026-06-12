import { useState } from "react";
import { trim, isValidFile } from "react-native-video-trim";
import { Platform } from "react-native";


const normalizeVideoPath = (uri: string) => {
  if (Platform.OS === "android" && uri.startsWith("file://")) {
    return uri.replace("file://", "");
  }
  return uri;
};



type UseVideoReturn = {
  videoUri: string | null;
  removeVideo: () => void;
  setVideoUri: (uri: string | null) => void;
  trimmedVideoUri: string | null;
  setTrimmedVideoUri: (uri: string | null) => void;
  trimVideo: (startMs: number, endMs: number) => Promise<void>;
  endTime: number;    // In seconds, for the prompt
  startTime: number;  // In seconds, for the prompt
};

export function useVideo(): UseVideoReturn {
  const [videoUriState, setVideoUriState] = useState<string | null>(null);
  const [trimmedVideoUriState, setTrimmedVideoUriState] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);

  const videoUri = videoUriState;
  const trimmedVideoUri = trimmedVideoUriState || videoUriState;

  const setVideoUri = (uri: string | null) => {
    setVideoUriState(uri);
    setTrimmedVideoUriState(null);
    setEndTime(0);
  };

  const removeVideo = () => {
    setVideoUriState(null);
    setTrimmedVideoUriState(null);
    setEndTime(0);
  };

  const setTrimmedVideoUri = (uri: string | null) => {
    setTrimmedVideoUriState(uri);
  };

  const trimVideo = async (startMs: number, endMs: number) => {
    setStartTime(startMs/1000);
    setEndTime(endMs/1000);

    console.log(`Trimming video from ${startMs/1000}.s to ${endMs/1000}.s`);
  };

  return {
    videoUri,
    removeVideo,
    setVideoUri,
    trimmedVideoUri,
    setTrimmedVideoUri,
    trimVideo,
    endTime,
    startTime
  };
}