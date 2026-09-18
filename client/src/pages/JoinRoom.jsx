import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSocketEvent, saveSession, socket } from '../hooks/useSocket.js';

export default function JoinRoom() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useSocketEvent('room_joined', ({ code: c, playerId }) => {
    saveSession(c, playerId);
    navigate(`/lobby/${c}`);
  });

  useSocketEvent('error_message', ({ text }) => setError(text));

  const handleJoin = () => {
    if (!name.trim()) return setError('Введите имя');
    if (!code.trim() || code.trim().length !== 4) return setError('Код — 4 символа');
    setError('');
    socket.emit('join_room', { name, code: code.toUpperCase().trim() });
  };

  return (
    <div className="min-h-screen px-6 py-8 flex flex-col">
      <button onClick={() => navigate(-1)} className="text-white/60 mb-6 self-start">
        ← Назад
      </button>

      <h2 className="text-3xl font-extrabold mb-6">Присоединиться</h2>

      <div className="flex-1 flex flex-col gap-6 max-w-md w-full mx-auto">
        <div>
          <label className="block text-white/60 mb-2 text-sm">Твоё имя</label>
          <input
            className="input-field"
            placeholder="Например, Маша"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
          />
        </div>

        <div>
          <label className="block text-white/60 mb-2 text-sm">Код комнаты</label>
          <input
            className="input-field text-center text-3xl tracking-[0.5em] font-extrabold uppercase"
            placeholder="ABCD"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
            maxLength={4}
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <motion.button
          whileTap={{ scale: 0.97 }}
          className="btn-primary mt-auto"
          onClick={handleJoin}
        >
          Войти
        </motion.button>
      </div>
    </div>
  );
}