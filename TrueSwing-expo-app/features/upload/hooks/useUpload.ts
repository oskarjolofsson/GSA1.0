import { useState } from "react";
import { Alert } from "react-native";
import { create_analysis, upload_video, confirm_upload, get_analysis_status } from "../services/uploadService"
import type { Prompt, CreateAnalysisResponse, AnalysisStatusResponse } from "../types";



export type UploadProps = {
    error: string | null;
    loading: boolean;
    analysisId: string | null;
    startUpload: (videoUri: string, prompt: Prompt, startTime?: number, endTime?: number) => Promise<void>;
    checkAnalysisStatus: (analysisId: string) => Promise<AnalysisStatusResponse | null>;
}


export function useUpload(): UploadProps {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatusResponse | null>(null);
    const [analysisId, setAnalysisId] = useState<string | null>(null);

    const startUpload = async (videoUri: string, prompt: Prompt, startTime: number = 0, endTime: number = 0) => {
        setError(null);
        setLoading(true);

        try {
            const createAnalaysisResponse: CreateAnalysisResponse = await create_analysis(prompt, startTime, endTime);
            setAnalysisId(createAnalaysisResponse.analysis_id);
            await upload_video(createAnalaysisResponse.upload_url, videoUri);
            await confirm_upload(createAnalaysisResponse.analysis_id);
        } catch (err) {
            console.error('Upload process failed:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred during upload');
        } finally {
            setLoading(false);
        }
    };

    const checkAnalysisStatus = async (analysisId: string) => {
        setError(null);
        try {
            const status: AnalysisStatusResponse = await get_analysis_status(analysisId);
            setAnalysisStatus(status);
            return status;
        } catch (err) {
            console.error('Error checking analysis status:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred while checking analysis status');
            return null;
        }
    };

    return {
        error,
        loading,
        analysisId,
        startUpload,
        checkAnalysisStatus
    } as UploadProps;
}