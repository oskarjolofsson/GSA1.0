import { createUploadTask, FileSystemUploadType } from 'expo-file-system/legacy';

import type { Prompt, CreateAnalysisResponse, AnalysisStatusResponse } from '../types';
import apiClient from 'lib/apiClient';
import { routes } from 'lib/api/routes';

export async function create_analysis(
  prompt: Prompt,
  startTime: number = 0,
  endTime: number = 0
): Promise<CreateAnalysisResponse> {
  // create body for the request
  const requestBody = {
    start_time: startTime,
    end_time: endTime,
    prompt_shape: prompt.desired_shot,
    prompt_miss: prompt.miss,
    prompt_extra: prompt.extra,
  };

  const result = (await apiClient.post<CreateAnalysisResponse>(
    routes.analyses.root,
    requestBody
  )) as CreateAnalysisResponse;

  if (!result || !result.upload_url || !result.analysis_id) {
    throw new Error('Failed to create analysis and get upload URL');
  }

  return result;
}

export type UploadProgress = { sentBytes: number; totalBytes: number };

/**
 * PUTs the trimmed clip to the signed URL, reporting real bytes as they go.
 *
 * `createUploadTask` rather than `fetch` because `fetch` reports nothing until
 * the whole body has gone. This is the one phase of the flow with a genuine
 * denominator, and it is the phase a golfer on range 4G actually waits through,
 * so the progress screen gets to show a true number instead of a timer.
 * The AI phase that follows has no sub-progress — see UploadProgressScreen.
 */
export async function upload_video(
  uploadUrl: string,
  videoUri: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<void> {
  // Validate the videoUri and uploadUrl
  if (!uploadUrl || !videoUri) {
    throw new Error('Invalid upload URL or video URI');
  }

  try {
    const task = createUploadTask(
      uploadUrl,
      videoUri,
      {
        httpMethod: 'PUT',
        uploadType: FileSystemUploadType.BINARY_CONTENT,
        headers: { 'Content-Type': 'video/mp4' },
      },
      ({ totalBytesSent, totalBytesExpectedToSend }) => {
        onProgress?.({ sentBytes: totalBytesSent, totalBytes: totalBytesExpectedToSend });
      }
    );

    const response = await task.uploadAsync();

    // uploadAsync resolves undefined if the task was cancelled.
    if (!response) {
      throw new Error('Upload was cancelled');
    }

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Failed to upload video: ${response.status}`);
    }
  } catch (error) {
    console.error('Upload Error:', error);
    throw error;
  }
}

export async function confirm_upload(analysisId: string): Promise<void> {
  if (!analysisId) {
    throw new Error('Invalid analysis ID for confirmation');
  }
  await apiClient.patch(routes.analyses.byId(analysisId));
}

export async function get_analysis_status(analysisId: string): Promise<AnalysisStatusResponse> {
  if (!analysisId) {
    throw new Error('Invalid analysis ID for status check');
  }
  return (await apiClient.get<AnalysisStatusResponse>(
    routes.analyses.byId(analysisId)
  )) as AnalysisStatusResponse;
}
