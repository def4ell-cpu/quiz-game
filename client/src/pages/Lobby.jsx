import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { socket, useSocketEvent, loadSession, saveSession } from '../hooks/useSocket.js';
import PlayerCard from '../components/PlayerCard.jsx';

export default function Lobby() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [myId, setMyId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const { code: savedCode, playerId } = loadSession();
    if (savedCode === code && playerId) {
      setMyId(playerId);
      socket.emit('reconnect_player', { code, playerId });
    } else {
      navigate('/');
    }
  }, [code, navigate]);

  useSocketEvent('room_update', (r) => {
    setRoom(r);
    if (r.state === 'reading' || r.state === 'answering' || r.state === 'scoring') {
      navigate(`/game/${code}`);
    }
    if (r.state === 'finished') {
      navigate(`/results/${code}`);
    }
  });

  useSocketEvent('room_joined', ({ code: c, playerId }) => {
    setMyId(playerId);
    saveSession(c, playerId);
  });

  useSocketEvent('error_message', ({ text }) => setError(text));

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/60">Загрузка лобби...</p>
      </div>
    );
  }

  const me = room.players.find((p) => p.id === myId);
  const isHost = room.hostId === myId;
  const allReady = room.players.every((p) => p.ready) && room.players.length >= 2;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const toggleReady = () => socket.emit('toggle_ready', { code });

  const startGame = () => {
    setError('');
    socket.emit('start_game', { code });
  };

  return (
    <div className="min-h-screen px-6 py-8 flex flex-col max-w-md w-full mx-auto">
      <h2 className="text-2xl font-bold text-center mb-2">Лобби</h2>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-3xl bg-gradient-to-br from-spark-primary/30 to-indigo-500/20 border border-white/10 p-6 text-center mb-6"
      >
        <p className="text-white/60 text-sm mb-1">Код комнаты</p>
        <p className="text-5xl font-extrabold tracking-[0.3em] mb-3">{code}</p>
        <button
          onClick={copyCode}
          className="text-sm text-spark-accent underline"
        >
          {copied ? 'Скопировано ✓' : 'Скопировать код'}
        </button>
      </motion.div>

      <p className="text-center text-white/60 mb-3">
        Игроки: <span className="text-white font-bold">{room.players.length}/{room.maxPlayers}</span>
      </p>

      <div className="flex flex-col gap-2 mb-6">
        {room.players.map((p) => (
          <PlayerCard
            key={p.id}
            player={p}
            isHost={p.id === room.hostId}
            isYou={p.id === myId}
          />
        ))}
      </div>

      {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}

      <div className="mt-auto flex flex-col gap-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          className={me?.ready ? 'btn-secondary' : 'btn-primary'}
          onClick={toggleReady}
        >
          {me?.ready ? 'Я не готов' : 'Я готов'}
        </motion.button>

        {isHost && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="btn-primary disabled:opacity-40"
            disabled={!allReady}
            onClick={startGame}
          >
            Начать игру
          </motion.button>
        )}
      </div>
    </div>
  );
}