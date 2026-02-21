import { useState } from 'react';

interface UseResultNavigationReturn {
    direction: number;
    onNextIssue: () => void;
    onPreviousIssue: () => void;
}

/**
 * Custom hook for navigating between issues with animation direction
 * @param activeIssue - Current issue index
 * @param setActiveIssue - Function to update active issue
 * @param totalIssues - Total number of issues
 * @returns Navigation functions and animation direction
 */
export default function useResultNavigation(
    activeIssue: number,
    setActiveIssue: (index: number) => void,
    totalIssues: number
): UseResultNavigationReturn {
    const [direction, setDirection] = useState<number>(0);

    const onNextIssue = () => {
        if (activeIssue < totalIssues - 1) {
            setDirection(1);
            setActiveIssue(activeIssue + 1);
        }
    };

    const onPreviousIssue = () => {
        if (activeIssue > 0) {
            setDirection(-1);
            setActiveIssue(activeIssue - 1);
        }
    };

    return {
        direction,
        onNextIssue,
        onPreviousIssue,
    };
}
