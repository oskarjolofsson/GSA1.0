import { useState, useEffect } from 'react';
import drillService from '../services/drillService';

export function useResultNavigation(activeProblem, setActiveProblem, key_findings) {
  const [drillPopupOpen, setDrillPopupOpen] = useState(false);
  const [direction, setDirection] = useState(0);
  const [drillImage, setDrillImage] = useState(null);

  // Fetch drill image when activeProblem changes
  useEffect(() => {
    const fetchDrillImage = async () => {
      try {
        const currentKeyFinding = key_findings[activeProblem];
        if (currentKeyFinding?.drill_id) {
          const drill = await drillService.getDrill(currentKeyFinding.drill_id);
          setDrillImage(drill?.image_url || null);
        } else {
          setDrillImage(null);
        }
      } catch (error) {
        console.error("Error fetching drill image:", error);
        setDrillImage(null);
      }
    };

    fetchDrillImage();
  }, [activeProblem, key_findings]);

  const handleDrillOpen = () => {
    setDrillPopupOpen(true);
  };

  const handleDrillClose = () => {
    setDrillPopupOpen(false);
  };

  const onNextDrill = () => {
    if (activeProblem < key_findings.length - 1) {
      setDirection(1);
      setActiveProblem(activeProblem + 1);
    }
  };

  const onPreviousDrill = () => {
    if (activeProblem > 0) {
      setDirection(-1);
      setActiveProblem(activeProblem - 1);
    }
  };

  return {
    drillPopupOpen,
    setDrillPopupOpen,
    direction,
    drillImage,
    handleDrillOpen,
    handleDrillClose,
    onNextDrill: activeProblem < key_findings.length - 1 ? onNextDrill : null,
    onPreviousDrill: activeProblem > 0 ? onPreviousDrill : null,
  };
}