import { motion } from 'framer-motion';

export default function PlayerCard({ player, isHost, isYou, current = false }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-between rounded-2xl px-4 py-3 border ${
        current
          ? 'border-spark-primary bg-spark-primary/15'
          : 'border-white/10 bg-white/5'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-3 h-3 rounded-full ${
            player.connected ? 'bg-green-400' : 'bg-red-400'
          }`}
        />
        <div>
          <p className="font-bold text-base">
            {player.name} {isYou && <span className="text-white/50">(ты)</span>}
          </p>
          <p className="text-xs text-white/50">
            {isHost ? '👑 хост' : 'игрок'} • ⭐ {player.stars}
          </p>
        </div>
      </div>
      <div>
        {player.ready ? (
          <span className="text-green-400 font-bold text-sm">ГОТОВ</span>
        ) : (
          <span className="text-white/40 font-bold text-sm">ждёт</span>
        )}
      </div>
    </motion.div>
  );
}