import { motion } from "framer-motion";


export default function FocusRing({ value }: { value: number }) {
  const radius = 56;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(147,197,253,1)" />
            <stop offset="50%" stopColor="rgba(125,211,252,1)" />
            <stop offset="100%" stopColor="rgba(165,243,252,1)" />
          </linearGradient>
        </defs>
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.3, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_65%)]">
        <span className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {value}
        </span>
        <span className="mt-1 text-xs uppercase tracking-[0.28em] text-white/45">
          Score
        </span>
      </div>
    </div>
  );
}