import * as React from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

function CircularProgressWithLabel(props) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" {...props} size={200} thickness={4} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="h4"
          component="div"
          sx={{ color: '#ffffff', fontWeight: 'bold' }}
        >
          {`${Math.round(props.value)}%`}
        </Typography>
      </Box>
    </Box>
  );
}

CircularProgressWithLabel.propTypes = {
  /**
   * The value of the progress indicator for the determinate variant.
   * Value between 0 and 100.
   * @default 0
   */
  value: PropTypes.number.isRequired, 
};

export default function CircularWithValueLabel({ time=30, full=false }) {
  // Time is in seconds
  const [progress, setProgress] = React.useState(10);

  React.useEffect(() => {
    const startTime = Date.now();
    const totalDuration = time * 1000; // Convert to milliseconds
    const maxProgress = full ? 100 : 99;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress_percent = elapsed / totalDuration; // 0 to 1

      // Easing function: cubic ease-out (starts fast, slows down)
      // Using: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress_percent, 3);

      // Calculate progress from 10 to maxProgress
      const newProgress = 10 + (maxProgress - 10) * Math.min(eased, 1);

      setProgress(newProgress);

      // Stop timer when time is reached
      if (elapsed >= totalDuration) {
        clearInterval(timer);
        setProgress(maxProgress);
      }
    }, 50);

    return () => {
      clearInterval(timer);
    };
  }, [time, full]);

  return (
    <div className="flex justify-center mt-6 px-4">
      <div className="w-full max-w-md bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-700">
        
        {/* Loading Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-lg font-semibold text-white">Analyzing Your Swing</h2>
          </div>
          <p className="text-sm text-gray-400 mt-2">Please wait while we process your video...</p>
        </div>

        {/* Loading Area */}
       
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <CircularProgressWithLabel value={progress} color="text.secondary" />
            <Typography
              variant="h6"
              sx={{
                color: '#ffffff',
                fontWeight: 500,
                textAlign: 'center',
              }}
            >
              Processing...
            </Typography>
          </Box>
        

        <p className="text-center text-gray-500 text-xs mt-4">
          This may take a few moments
        </p>
      </div>
    </div>
  );
}
