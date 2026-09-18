import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { socket, useSocketEvent, loadSession, clearSession } from '../hooks/useSocket.js';

export default function Results() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState(location.state || null);
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    const { playerId } = loadSession();
    setMyId(playerId);
  }, []);

  // Все получают game_over — все видят финал
  useSocketEvent('game_over', (d) => setData(d));

  // Если хост нажал «Реванш» — все возвращаются в лобби
  useSocketEvent('room_update', (r) => {
    if (r.state === 'lobby') navigate(`/lobby/${code}`);
  });

  const playAgain = () => socket.emit('play_again', { code });
  const toMenu = () => {
    clearSession();
    navigate('/');
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/60">Загрузка результатов...</p>
      </div>
    );
  }

  const winner = data.winner;
  const scores = data.scores || [];

  return (
    <div className="min-h-screen px-6 py-8 flex flex-col max-w-md w-full mx-auto">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-extrabold text-center mb-2"
      >
        🏆 Игра окончена
      </motion.h2>

      {winner && (
        <motion.p
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-xl mb-8"
        >
          Победитель:{' '}
          <span className="text-spark-gold font-extrabold">
            {winner.name} ({winner.stars} ⭐)
          </span>
        </motion.p>
      )}

      <div className="flex flex-col gap-2 mb-8">
        {scores.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i }}
            className={`flex items-center justify-between rounded-2xl px-4 py-4 border ${
              s.id === myId
                ? 'border-spark-primary bg-spark-primary/20'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl font-extrabold text-white/40">
                #{i + 1}
              </span>
              <span className="font-bold">{s.name}</span>
            </div>
            <span className="text-spark-gold font-extrabold text-lg">
              ⭐ {s.stars}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="btn-primary"
          onClick={playAgain}
        >
          Реванш
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="btn-secondary"
          onClick={toMenu}
        >
          В меню
        </motion.button>
      </div>

      <p className="text-center text-white/30 text-xs mt-4">
        «Реванш» может нажать любой игрок
      </p>
    </div>
  );
}