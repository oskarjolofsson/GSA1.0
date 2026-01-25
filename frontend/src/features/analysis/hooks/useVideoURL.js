import { useState, useEffect } from 'react';
import pastDrillService from '../../../services/pastDrillService.js';

export function useVideoURL(activeAnalysis) {
    const [videoURL, setVideoURL] = useState(null);
    const [videoURLCache, setVideoURLCache] = useState({});

    useEffect(() => {
        const fetchVideoURL = async () => {
            if (!activeAnalysis) {
                setVideoURL(null);
                return;
            }

            if (videoURLCache[activeAnalysis.analysis_id]) {
                console.log("Using cached video URL for analysis:", activeAnalysis.analysis_id);
                setVideoURL(videoURLCache[activeAnalysis.analysis_id]);
                return;
            }

            if (!activeAnalysis.video_key) {
                console.warn("No video_key available for analysis:", activeAnalysis.analysis_id);
                setVideoURL(null);
                return;
            }

            try {
                console.log("Fetching video URL for analysis:", activeAnalysis.analysis_id);
                const url = await pastDrillService.getAnalysisVideoURL(
                    activeAnalysis.analysis_id,
                    activeAnalysis.video_key
                );
                setVideoURL(url);

                setVideoURLCache((prev) => ({
                    ...prev,
                    [activeAnalysis.analysis_id]: url,
                }));
            } catch (err) {
                console.error("Error fetching video URL:", err);
                setVideoURL(null);
            }
        };

        fetchVideoURL();
    }, [activeAnalysis, videoURLCache]);

    return videoURL;
}
