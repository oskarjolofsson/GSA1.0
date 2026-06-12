// Public surface for features/scrubber.
// Use VideoScrubber as a drop-in component, or compose useScrubber + ScrubberBar
// with your own <VideoView> when you need a custom layout.
export { default as VideoScrubber } from './screens/VideoScrubber';
export { default as ScrubberBar } from './components/ScrubberBar';
export { useScrubber } from './hooks/useScrubber';
export { useThumbnails } from './hooks/useThumbnails';
export { usePlayerSync } from './hooks/usePlayerSync';
export type { ScrubberMode, ScrubberRange, ScrubberRef, ScrubberAPI } from './types';
