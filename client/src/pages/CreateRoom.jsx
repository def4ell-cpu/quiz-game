import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSocketEvent, saveSession, socket } from '../hooks/useSocket.js';

export default function CreateRoom() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [mode, setMode] = useState('couples'); // по умолчанию — для пар
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [questionsCount, setQuestionsCount] = useState(32);
  const [answerTime, setAnswerTime] = useState(60);
  const [error, setError] = useState('');

  useSocketEvent('room_created', ({ code, playerId }) => {
    saveSession(code, playerId);
    navigate(`/lobby/${code}`);
  });

  useSocketEvent('error_message', ({ text }) => setError(text));

  const handleCreate = () => {
    if (!name.trim()) return setError('Введите имя');
    setError('');
    socket.emit('create_room', { name, maxPlayers, questionsCount, answerTime, mode });
  };

  return (
    <div className="min-h-screen px-6 py-8 flex flex-col">
      <button onClick={() => navigate(-1)} className="text-white/60 mb-6 self-start">
        ← Назад
      </button>

      <h2 className="text-3xl font-extrabold mb-6">Создать комнату</h2>

      <div className="flex-1 flex flex-col gap-6 max-w-md w-full mx-auto">
        <div>
          <label className="block text-white/60 mb-2 text-sm">Твоё имя</label>
          <input
            className="input-field"
            placeholder="Например, Саша"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
          />
        </div>

        {/* Выбор режима — большие две кнопки */}
        <div>
          <label className="block text-white/60 mb-2 text-sm">Режим игры</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('friends')}
              className={`rounded-2xl p-4 text-left transition ${
                mode === 'friends'
                  ? 'bg-gradient-to-br from-spark-primary to-indigo-500 text-white shadow-lg'
                  : 'bg-white/5 border border-white/15 text-white/70'
              }`}
            >
              <p className="text-3xl mb-1">👯</p>
              <p className="font-bold">Для друзей</p>
              <p className="text-xs opacity-70 mt-1">Весёлые и лёгкие вопросы</p>
            </button>
            <button
              onClick={() => setMode('couples')}
              className={`rounded-2xl p-4 text-left transition ${
                mode === 'couples'
                  ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white/5 border border-white/15 text-white/70'
              }`}
            >
              <p className="text-3xl mb-1">💞</p>
              <p className="font-bold">Для пар</p>
              <p className="text-xs opacity-70 mt-1">Тёплые и глубокие вопросы</p>
            </button>
          </div>
        </div>

        <Segmented
          label="Количество игроков"
          options={[2, 3, 4]}
          value={maxPlayers}
          onChange={setMaxPlayers}
        />

        <Segmented
          label="Количество вопросов"
          options={[16, 32, 64]}
          value={questionsCount}
          onChange={setQuestionsCount}
        />

        <Segmented
          label="Время на ответ (сек)"
          options={[60, 90, 120]}
          value={answerTime}
          onChange={setAnswerTime}
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <motion.button
          whileTap={{ scale: 0.97 }}
          className="btn-primary mt-auto"
          onClick={handleCreate}
        >
          Создать
        </motion.button>
      </div>
    </div>
  );
}

function Segmented({ label, options, value, onChange }) {
  return (
    <div>
      <label className="block text-white/60 mb-2 text-sm">{label}</label>
      <div className="grid grid-cols-3 gap-2 bg-white/5 rounded-2xl p-1">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`py-3 rounded-xl font-bold transition ${
              value === opt
                ? 'bg-gradient-to-r from-spark-primary to-indigo-500 text-white'
                : 'text-white/60'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}