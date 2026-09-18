import { motion } from 'framer-motion';

export default function Timer({ seconds = 0, total = 0, size = 160 }) {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? Math.max(0, Math.min(1, seconds / total)) : 0;
  const offset = circumference * (1 - progress);

  const danger = seconds <= 5 && seconds > 0;
  const color = danger ? '#ef4444' : '#a78bfa';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="10"
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          key={seconds}
          initial={{ scale: 1.2, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-5xl font-extrabold ${danger ? 'text-red-400' : 'text-white'}`}
        >
          {seconds}
        </motion.span>
      </div>
    </div>
  );
}