import { useState, useEffect } from 'react';
import analysisService from '../services/analysisService.js';

export default function useAnalyses() {
    //const [analyses, setAnalyses] = useState([]);
    const [analysis_ids, setAnalysisIds] = useState([]);    // fetched_analysis_ids is an array of { analysis_id, createdAt, video_url }
    const [activeAnalysis, setActiveAnalysis] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserAnalyses = async () => {
            try {
                const fetched_analysis_ids = await analysisService.getAnalysesForUser();    // Fetch list of analysis_objects, containing ID, createdAt and imageURL of thumbnail
                // fetched_analysis_ids is an array of { analysis_id, createdAt, video_url, title }

                // sort based on createdAt with newest first
                fetched_analysis_ids.sort((a, b) => {
                    const dateA = new Date(a.createdAt || 0).getTime();
                    const dateB = new Date(b.createdAt || 0).getTime();
                    return dateB - dateA;
                });
                console.log("Fetched analyses:", fetched_analysis_ids);

                setAnalysisIds(fetched_analysis_ids);
            } catch (err) {
                console.error("Error fetching analyses:", err);
                setError(err.message);
            }
        };

        const fetchActiveanalysis = async (analysis_id) => {
            try {
                const analysisData = await analysisService.getAnalysisById(analysis_id);
                setActiveAnalysis(analysisData);    
            } catch (err) {
                console.error("Error fetching active analysis:", err);
                setError(err.message);
            }
        }

        setError(null);
        setLoading(true);

        fetchUserAnalyses();
        console.log("Fetched analysis IDs:", analysis_ids);

        // Check if there is an analysisId in the URL to set as activeAnalysis
        // const urlParams = new URLSearchParams(window.location.search);
        // const analysisId = urlParams.get('analysisId') ? urlParams.get('analysisId') : analysis_ids.length > 0 ? analysis_ids[0].analysis_id : null;
        
        // if (analysisId) {
        //     fetchActiveanalysis(analysisId);
        // }

        setLoading(false);
    }, []);

    return { activeAnalysis, loading, error };
}
