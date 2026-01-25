

import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { CircularProgressLabel } from "./CircularProgressLabel";

export function AnalysisProgress({ durationSeconds, full = false }) {
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    const startTime = Date.now();
    const totalDuration = durationSeconds * 1000;
    const maxProgress = full ? 100 : 99;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / totalDuration, 1);

      const eased = 1 - Math.pow(1 - t, 3);
      const value = 10 + (maxProgress - 10) * eased;

      setProgress(value);

      if (t === 1) {
        clearInterval(timer);
        setProgress(maxProgress);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [durationSeconds, full]);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
      <CircularProgressLabel value={progress} />
      <Typography variant="h6" sx={{ color: "#fff" }}>
        Processing...
      </Typography>
    </Box>
  );
}
