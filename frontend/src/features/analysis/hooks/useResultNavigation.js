import { useState } from 'react';

export default function useResultNavigation(activeIssue, setActiveIssue, totalIssues) {
  const [direction, setDirection] = useState(0);

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