import { useState, useEffect } from 'react';
import analysisService from '../services/analysisService.js';

export default function useAnalyses() {
    const [analyses, setAnalyses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserAnalyses = async () => {
            try {
                setLoading(true);
                setError(null);

                const analyses = await analysisService.getAnalysesForUser();

                const normalizedAnalyses = analyses.sort((a, b) => {
                    const dateA = new Date(a.createdAt || 0).getTime();
                    const dateB = new Date(b.createdAt || 0).getTime();
                    return dateB - dateA;
                });

                setAnalyses(normalizedAnalyses);
            } catch (err) {
                console.error("Error fetching analyses:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUserAnalyses();
    }, []);

    return { analyses, loading, error };
}
