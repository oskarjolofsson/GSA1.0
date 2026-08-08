import { useCallback, useState } from 'react';
import {
  create_analysis,
  upload_video,
  confirm_upload,
  get_analysis_status,
} from '../services/uploadService';
import type { Prompt, CreateAnalysisResponse, AnalysisStatusResponse } from '../types';

/** Where the flow has actually got to.
 *
 *  `uploading` is the only phase with a real denominator — bytes sent over bytes
 *  expected — and it is reported as such. `analysing` has none: the backend's
 *  Analysis.status is constrained to awaiting_upload | processing | completed |
 *  failed, with no sub-progress inside processing, and the model does not report
 *  how far through it is. The screen shows a stage there, never a percentage. */
export type UploadPhase = 'idle' | 'preparing' | 'uploading' | 'analysing' | 'done' | 'error';

export type UploadProps = {
  error: string | null;
  loading: boolean;
  analysisId: string | null;
  phase: UploadPhase;
  /** Bytes actually sent, and expected. Both 0 until the PUT begins. */
  sentBytes: number;
  totalBytes: number;
  startUpload: (
    videoUri: string,
    prompt: Prompt,
    startTime?: number,
    endTime?: number
  ) => Promise<void>;
  checkAnalysisStatus: (analysisId: string) => Promise<AnalysisStatusResponse | null>;
};

export function useUpload(): UploadProps {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [sentBytes, setSentBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);

  const startUpload = async (
    videoUri: string,
    prompt: Prompt,
    startTime: number = 0,
    endTime: number = 0
  ) => {
    setError(null);
    setLoading(true);
    setPhase('preparing');
    setSentBytes(0);
    setTotalBytes(0);

    try {
      const createAnalaysisResponse: CreateAnalysisResponse = await create_analysis(
        prompt,
        startTime,
        endTime
      );
      setAnalysisId(createAnalaysisResponse.analysis_id);

      setPhase('uploading');
      await upload_video(
        createAnalaysisResponse.upload_url,
        videoUri,
        ({ sentBytes: sent, totalBytes: total }) => {
          setSentBytes(sent);
          setTotalBytes(total);
        }
      );

      await confirm_upload(createAnalaysisResponse.analysis_id);
      setPhase('analysing');
    } catch (err) {
      console.error('Upload process failed:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during upload');
      setPhase('error');
    } finally {
      setLoading(false);
    }
  };

  const checkAnalysisStatus = useCallback(async (analysisId: string) => {
    try {
      const status: AnalysisStatusResponse = await get_analysis_status(analysisId);
      if (status.status === 'completed') setPhase('done');
      return status;
    } catch (err) {
      console.error('Error checking analysis status:', err);
      // Deliberately not setPhase('error'): a single failed poll on flaky
      // range signal is not a failed analysis, and tearing the screen down
      // for it loses an upload that is still running server-side.
      return null;
    }
  }, []);

  return {
    error,
    loading,
    analysisId,
    phase,
    sentBytes,
    totalBytes,
    startUpload,
    checkAnalysisStatus,
  };
}
