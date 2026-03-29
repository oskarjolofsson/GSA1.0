import { useEffect, useRef, useState, useCallback } from "react"
import { Play, Pause, RotateCcw } from "lucide-react"
import { Range } from "react-range"

interface VideoDemoProps {
    url: string | null;
    mode?: "playback" | "trim";
    start?: number;
    end?: number | null;
    onStartChange?: ((time: number) => void) | null;
    onEndChange?: ((time: number) => void) | null;
    onTrimClose?: (() => void) | null;
}

export default function VideoDemo({ 
  url, 
  mode = "playback",
  start = 0,
  end = null,
  onStartChange = null,
  onEndChange = null,
  onTrimClose = null
}: VideoDemoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const progressBarRef = useRef<HTMLDivElement | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [isSeeking, setIsSeeking] = useState(false)
  const [duration, setDuration] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const seekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressToggleRef = useRef(false)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined
    if (isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 1500)
    }
    return () => clearTimeout(timeout)
  }, [isPlaying])

  // Initialize trim times when duration loads
  useEffect(() => {
    if (duration > 0 && mode === "trim") {
      if (trimStart === 0 && trimEnd === 0) {
        setTrimStart(start)
        setTrimEnd(end || duration)
      }
    }
  }, [duration, mode, start, end])

  // Notify parent of trim changes
  useEffect(() => {
    if (mode === "trim") {
      if (onStartChange) onStartChange(trimStart)
      if (onEndChange) onEndChange(trimEnd)
    }
  }, [trimStart, trimEnd, mode, onStartChange, onEndChange])

  // Cleanup seek timeout on unmount
  useEffect(() => {
    return () => {
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current)
      }
    }
  }, [])

  const togglePlay = () => {
    if (suppressToggleRef.current) return;
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
      setShowControls(true)
    }
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || isSeeking) return
    setProgress((video.currentTime / video.duration) * 100 || 0)

    if (video.ended) {
      setIsPlaying(false)
      setShowControls(true)
    }
  }

  // Debounced seek with seeked event - fixes frame preview on mobile
  const jumpVideo = useCallback((t: number) => {
    const v = videoRef.current
    if (!v) return

    // Clear any pending seek
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current)
    }

    // Debounce seeks (16ms delay) to prevent overwhelming mobile browsers
    seekTimeoutRef.current = setTimeout(() => {
      if (isSeeking) return
      setIsSeeking(true)

      const onSeeked = () => {
        v.removeEventListener('seeked', onSeeked)
        setIsSeeking(false)
      }

      v.addEventListener('seeked', onSeeked)
      v.currentTime = t

      // Fallback: clear seeking state after timeout in case seeked doesn't fire
      setTimeout(() => {
        if (isSeeking) {
          setIsSeeking(false)
        }
      }, 1000)
    }, 5)
  }, [isSeeking])

  const seekAtClientX = useCallback((clientX: number) => {
    if (!progressBarRef.current || !videoRef.current) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    setProgress(percent * 100)
    jumpVideo(percent * videoRef.current.duration)
  }, [jumpVideo])

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return
    seekAtClientX(e.clientX)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    suppressToggleRef.current = true
    setIsDragging(true)
    seekAtClientX(e.clientX)

    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause()
      setIsPlaying(false)
      setShowControls(true)
    }
  }

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging) return
    seekAtClientX(e.clientX)
  }, [isDragging, seekAtClientX])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    // Clear after click cycle so release-click can't toggle play
    requestAnimationFrame(() => {
      suppressToggleRef.current = false
    })
  }, [])

  useEffect(() => {
    if (isDragging) {
      setShowControls(false)
      document.addEventListener("pointermove", handlePointerMove)
      document.addEventListener("pointerup", handlePointerUp)
      document.addEventListener("pointercancel", handlePointerUp)
      return () => {
        document.removeEventListener("pointermove", handlePointerMove)
        document.removeEventListener("pointerup", handlePointerUp)
        document.removeEventListener("pointercancel", handlePointerUp)
      }
    }
  }, [isDragging, handlePointerMove, handlePointerUp])

  // Handle range slider change with both handles
  const onRangeChange = useCallback((values: number[]) => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowControls(true);
    }

    const prevStart = trimStart;
    const prevEnd = trimEnd;
    setTrimStart(values[0]);
    setTrimEnd(values[1]);

    if (Math.abs(values[0] - prevStart) > Math.abs(values[1] - prevEnd)) {
      jumpVideo(values[0]);
    } else {
      jumpVideo(values[1]);
    }
  }, [jumpVideo, trimStart, trimEnd])

  function formatTime(s: number, digits = 2) {
    if (!Number.isFinite(s)) return "0.00"
    return s.toFixed(digits)
  }

  return (
    <>
      {url ? (
        <div className="w-full px-4 pt-6 pb-0 flex justify-center max-sm:px-0">
          <div
            ref={containerRef}
            className="relative w-full  overflow-hidden rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]"
            onClick={mode === "trim" ? undefined : togglePlay}
          >
            <video
              ref={videoRef}
              src={url}
              playsInline
              onTimeUpdate={handleTimeUpdate}
              muted={(isDragging) ? true : false}
              onLoadedMetadata={() => {
                const d = videoRef.current?.duration || 0
                if (d > 0) {
                  setDuration(d)
                  if (mode === "trim") {
                    setTrimEnd(d)
                  }
                }
              }}
              className="w-full h-auto object-contain bg-black"
            />

            {/* Center Play / Pause - Playback mode only */}
            {mode === "playback" && showControls && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="rounded-full bg-black/60 backdrop-blur-md p-4">
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-white" />
                  ) : videoRef.current?.ended ? (
                    <RotateCcw className="w-8 h-8 text-white" />
                  ) : (
                    <Play className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>
            )}

            {/* Progress Bar - Playback mode only */}
            {mode === "playback" && (
              <div
                ref={progressBarRef}
                className="absolute bottom-0 left-0 right-0 h-2.5 bg-white/20 cursor-pointer border-t border-white touch-none"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSeekClick(e)
                }}
                onPointerDown={handlePointerDown}
              >
                <div
                  className="h-full bg-white"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-3xl mx-auto mt-6 aspect-video bg-black/20 rounded-2xl border border-white/10 flex items-center justify-center text-slate-500">
          Video Player Placeholder
        </div>
      )}

      {/* Trim Controls - Trim mode only */}
      {mode === "trim" && duration > 0 && (
        <div className="w-full mt-4 space-y-4">
          {/* Dual-handle Range Slider */}
          <div className="px-2">
            <Range
              step={0.01}
              min={0}
              max={duration}
              values={[trimStart, trimEnd]}
              onChange={onRangeChange}
              renderTrack={({ props, children }) => (
                <div
                  onMouseDown={props.onMouseDown}
                  onTouchStart={props.onTouchStart}
                  className="h-6 flex w-full rounded-full"
                  style={props.style}
                >
                  <div
                    ref={props.ref}
                    className="h-2 w-full rounded-full bg-white/10 self-center relative"
                  >
                    {/* Filled track between handles */}
                    <div
                      className={`absolute h-2 rounded-full ${
                        Math.max(0, trimEnd - trimStart) > 5
                          ? "bg-red-500/60"
                          : "bg-emerald-500/60"
                      }`}
                      style={{
                        left: `${(trimStart / duration) * 100}%`,
                        right: `${100 - (trimEnd / duration) * 100}%`,
                      }}
                    />
                    {children}
                  </div>
                </div>
              )}
              renderThumb={({ props, isDragged, index }) => {
                const value = index === 0 ? trimStart : trimEnd
                const percentage = (value / duration) * 100
                let labelAlignment = "center"
                if (percentage < 15) {
                  labelAlignment = "left"
                } else if (percentage > 85) {
                  labelAlignment = "right"
                }

                return (
                  <div
                    {...props}
                    className="relative"
                    style={{
                      ...props.style,
                    }}
                  >
                    <div
                      className={`h-5 w-5 rounded-full transition-colors ${
                        isDragged
                          ? "bg-white shadow-lg shadow-white/50"
                          : "bg-white/80 hover:bg-white"
                      }`}
                      style={{
                        boxShadow: isDragged
                          ? "0 0 8px rgba(255, 255, 255, 0.5)"
                          : "none",
                      }}
                    />
                    {/* Value label underneath thumb */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 text-xs font-semibold text-white/90 whitespace-nowrap pointer-events-none">
                      {formatTime(value)}
                    </div>
                  </div>
                )
              }}
            />
          </div>

          {/* Trimmed length display */}
          <div className="px-2 pt-4 border-t border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs text-white/80">
              <span className="font-medium">Trimmed video length:</span>
              <span
                className={`font-semibold ${
                  Math.max(0, trimEnd - trimStart) > 5
                    ? "text-red-400"
                    : "text-emerald-400"
                }`}
              >
                {formatTime(Math.max(0, trimEnd - trimStart))}
              </span>
            </div>
            <div className="text-xs text-white/50">
              Recommended: 2-3 seconds. Maximum: 5 seconds.
            </div>
          </div>
        </div>
      )}
    </>
  )
}