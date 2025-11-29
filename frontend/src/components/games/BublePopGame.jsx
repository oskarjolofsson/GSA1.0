import { useState, useEffect, useRef } from "react";

export default function BubblePopGame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bubbles, setBubbles] = useState([]);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [missFeedback, setMissFeedback] = useState(false);
  const gameRef = useRef(null);
  const lastSpawnRef = useRef(Date.now());
  const feedbackTimeoutRef = useRef(null);
  
  // Game state refs
  const bubblesRef = useRef([]);
  const speedMultiplierRef = useRef(1);

  // Spawn bubbles
  const spawnBubble = () => {
    const gameBox = gameRef.current;
    if (!gameBox) return;

    const width = gameBox.clientWidth;

    const newBubble = {
      id: crypto.randomUUID(),
      x: Math.random() * (width - 50), // random horizontal
      y: gameBox.clientHeight,        // start at bottom
      size: 30 + Math.random() * 30,  // 30–60px
      // Faster start speed: 2.0 to 4.0
      speed: 2.0 + Math.random() * 2.0
    };

    bubblesRef.current.push(newBubble);
  };

  // Game loop using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) return;

    let animationFrame;
    const gameLoop = () => {
      // Increase speed multiplier slowly
      speedMultiplierRef.current += 0.0005;

      const currentBubbles = bubblesRef.current;
      const nextBubbles = [];
      let newMissed = 0;

      // Move bubbles
      for (const b of currentBubbles) {
        b.y -= b.speed * speedMultiplierRef.current;
        
        // Check if still visible
        if (b.y + b.size > 0) {
          nextBubbles.push(b);
        } else {
          newMissed++;
        }
      }

      bubblesRef.current = nextBubbles;

      // Update missed count
      if (newMissed > 0) {
        setMissed((m) => m + newMissed);
        setMissFeedback(true);
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = setTimeout(() => setMissFeedback(false), 200);
      }

      // Sync state for render
      setBubbles([...nextBubbles]);

      // Spawn new bubbles
      const now = Date.now();
      // Spawn faster: every 600–1000ms
      if (now - lastSpawnRef.current > 600 + Math.random() * 400) {
        spawnBubble();
        lastSpawnRef.current = now;
      }

      animationFrame = requestAnimationFrame(gameLoop);
    };

    animationFrame = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying]);

  // Start game handler
  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setMissed(0);
    setBubbles([]);
    bubblesRef.current = [];
    speedMultiplierRef.current = 1;
    lastSpawnRef.current = Date.now();
  };

  // Stop game handler
  const stopGame = () => {
    setIsPlaying(false);
  };

  // Bubble pop handler
  const popBubble = (id) => {
    bubblesRef.current = bubblesRef.current.filter((b) => b.id !== id);
    setBubbles([...bubblesRef.current]);
    setScore((s) => s + 1);
  };

  return (
    <div className="flex justify-center mt-6 px-4">
      <div className="w-full max-w-md bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-700">
        
        {/* Game Header */}
        <div className="text-center mb-3 relative">
          {isPlaying && (
            <button
              onClick={stopGame}
              className="absolute right-0 top-0 text-xs font-medium text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5"
            >
              Cancel
            </button>
          )}
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-lg font-semibold text-white">Bubble Pop</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1">Play a game while we find the best ways to improve your golf swing...</p>
          <div className="mt-2 flex justify-center gap-4 text-white font-medium">
            <div>Score: <span className="text-teal-400">{score}</span></div>
            <div>Missed: <span className="text-red-400">{missed}</span></div>
          </div>
        </div>

        {/* Game Area */}
        <div
          ref={gameRef}
          className={`
            relative overflow-hidden 
            bg-gradient-to-b from-gray-800 to-gray-900
            rounded-lg border 
            h-[400px] sm:h-[500px] 
            touch-none
            transition-colors duration-100
            ${missFeedback ? "border-red-500 shadow-[inset_0_0_20px_rgba(220,38,38,0.5)]" : "border-gray-700"}
          `}
        >
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 backdrop-blur-sm">
              <button
                onClick={startGame}
                className="px-8 py-3 bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg rounded-full shadow-lg transition transform hover:scale-105 active:scale-95"
              >
                Start Game
              </button>
            </div>
          )}

          {bubbles.map((bubble) => (
            <div
              key={bubble.id}
              onPointerDown={(e) => {
                e.preventDefault();
                popBubble(bubble.id);
              }}
              className="
                absolute rounded-full cursor-pointer
                bg-teal-400 bg-opacity-30 backdrop-blur-sm
                border border-teal-300 shadow-md
                hover:bg-opacity-50 transition
              "
              style={{
                width: bubble.size,
                height: bubble.size,
                left: bubble.x,
                top: bubble.y,
              }}
            ></div>
          ))}
        </div>

        <p className="text-center text-gray-500 text-xs mt-2">
          Tap bubbles to pop them! 
        </p>
      </div>
    </div>
  );
}
