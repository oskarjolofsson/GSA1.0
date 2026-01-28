import { useState, useEffect } from 'react';
import analysisService from '../services/analysisService.js';

export default function useVideoURL(activeAnalysis) {
    const [videoURL, setVideoURL] = useState(null);

    useEffect(() => {
        const fetchVideoURL = async () => {
            if (!activeAnalysis) {
                setVideoURL(null);
                return;
            }

            if (!activeAnalysis.video_key) {
                console.warn("No video_key available for analysis:", activeAnalysis.analysis_id);
                setVideoURL(null);
                return;
            }

            try {
                console.log("Fetching video URL for analysis:", activeAnalysis.analysis_id);
                const url = await analysisService.getAnalysisVideoURL(
                    activeAnalysis.analysis_id,
                    activeAnalysis.video_key
                );
                setVideoURL(url);
            } catch (err) {
                console.error("Error fetching video URL:", err);
                setVideoURL(null);
            }
        };

        fetchVideoURL();
    }, [activeAnalysis]);

    return videoURL;
}
