import { useEffect, useRef, useState } from "react"
import { Play, Pause } from "lucide-react"

export default function VideoDemo({ url }) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showControls, setShowControls] = useState(true)

  useEffect(() => {
    let timeout
    if (isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 1500)
    }
    return () => clearTimeout(timeout)
  }, [isPlaying])

  const togglePlay = () => {
    if (!videoRef.current) return

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
    if (!video) return
    setProgress((video.currentTime / video.duration) * 100 || 0)
  }

  const handleSeek = (e) => {
    const video = videoRef.current
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    video.currentTime = percent * video.duration
  }

  return (
    <>
      {url ? (
        <div className="w-full px-4 py-6 flex justify-center max-sm:px-0">
          <div
            ref={containerRef}
            className="relative w-full overflow-hidden rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]"
            onClick={togglePlay}
          >
            <video
              ref={videoRef}
              src={url}
              playsInline
              onTimeUpdate={handleTimeUpdate}
              className="w-full h-auto"
            />

            {/* Center Play / Pause */}
            {showControls && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="rounded-full bg-black/60 backdrop-blur-md p-4">
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-white" />
                  ) : (
                    <Play className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 cursor-pointer"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-white"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-3xl mx-auto mt-6 aspect-video bg-black/20 rounded-2xl border border-white/10 flex items-center justify-center text-slate-500">
          Video Player Placeholder
        </div>
      )}
    </>
  );
}