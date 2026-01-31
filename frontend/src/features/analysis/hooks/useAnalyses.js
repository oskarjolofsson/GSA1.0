import { useState, useEffect } from 'react';
import analysisService from '../services/analysisService.js';

// Custom hook to fetch and manage analyses for the user
export default function useAnalyses() {
    const [allAnalyses, setAllAnalyses] = useState([]); // [{ analysis_id, createdAt, video_url, title }]
    const [activeAnalysis, setActiveAnalysis] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // 1. Fetch list
                const fetched = await analysisService.getAnalysesForUser();

                // 2. Sort newest first
                fetched.sort((a, b) => {
                    const dateA = new Date(a.createdAt || 0).getTime();
                    const dateB = new Date(b.createdAt || 0).getTime();
                    return dateB - dateA;
                });

                setAllAnalyses(fetched);

                // 3. Resolve active analysis ID
                const urlParams = new URLSearchParams(window.location.search);
                const analysisIdFromUrl = urlParams.get('analysisId');

                const resolvedAnalysisId =
                    analysisIdFromUrl ??
                    fetched[0]?.analysis_id ??
                    null;

                // 4. Fetch active analysis
                if (resolvedAnalysisId) {
                    const analysisData =
                        await analysisService.getAnalysisById(resolvedAnalysisId);

                    setActiveAnalysis(analysisData);
                } else {
                    setActiveAnalysis(null);
                }
            } catch (err) {
                console.error('Error fetching analyses:', err);
                setError(err.message ?? 'Failed to fetch analyses');
                setActiveAnalysis(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Method to switch active analysis by ID
    const setActiveAnalysisById = async (analysisId) => {
        try {
            setLoading(true);
            setError(null);
            
            const analysisData = await analysisService.getAnalysisById(analysisId);
            setActiveAnalysis(analysisData);
        } catch (err) {
            console.error('Error setting active analysis:', err);
            setError(err.message ?? 'Failed to load analysis');
        } finally {
            setLoading(false);
        }
    };

    return {
        allAnalyses,
        activeAnalysis,
        setActiveAnalysisById,
        loading,
        error
    };
}
