import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Menu() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-spark-primary via-fuchsia-400 to-spark-accent bg-clip-text text-transparent">
          Quiz Sparks
        </h1>
        <p className="mt-4 text-white/60 text-lg">
          Игра для пар и друзей ✨
        </p>
      </motion.div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="btn-primary"
          onClick={() => navigate('/create')}
        >
          Создать комнату
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="btn-secondary"
          onClick={() => navigate('/join')}
        >
          Присоединиться
        </motion.button>
      </div>

      <p className="mt-12 text-white/30 text-xs text-center max-w-xs">
        2–4 игрока • отвечай на вопросы • ставь звёзды • побеждай
      </p>
    </div>
  );
}