import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { socket, useSocketEvent, loadSession } from '../hooks/useSocket.js';
import Timer from '../components/Timer.jsx';
import Stars from '../components/Stars.jsx';
import Question from '../components/Question.jsx';

const PHASE = { IDLE: 'idle', ANSWERING: 'answering', SCORING: 'scoring' };

export default function Game() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [myId, setMyId] = useState(null);
  const [phase, setPhase] = useState(PHASE.IDLE);
  const [question, setQuestion] = useState(null);
  const [answerer, setAnswerer] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [scores, setScores] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [roundResult, setRoundResult] = useState(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [totalRounds, setTotalRounds] = useState(16);

  useEffect(() => {
  const { playerId } = loadSession();
  if (playerId) setMyId(playerId);

  // Запрашиваем текущее состояние игры (если пропустили question_start)
  socket.emit('request_state', { code });
  const t = setTimeout(() => {
    socket.emit('request_state', { code });
  }, 500);

  return () => clearTimeout(t);
}, [code]);

  useSocketEvent('question_start', (data) => {
  setQuestion({ text: data.questionText, category: data.category });
  setAnswerer({ id: data.answererId, name: data.answererName });
  setTotalTime(data.duration);
  setRemaining(data.duration);
  setPhase(PHASE.ANSWERING);
  setMyRating(0);
  setRoundResult(null);
  setRoundNumber(data.roundNumber);
  setTotalRounds(data.totalRounds);
  vibrate(30);
});

  useSocketEvent('scoring_phase', (data) => {
    setTotalTime(data.duration);
    setRemaining(data.duration);
    setPhase(PHASE.SCORING);
    setMyRating(0);
    vibrate([30, 40, 30]);
  });

  useSocketEvent('timer_tick', ({ remaining: r }) => setRemaining(r));

  useSocketEvent('round_result', (data) => {
    setRoundResult(data);
    setScores(data.scores || []);
    setPhase(PHASE.IDLE);
  });

  useSocketEvent('game_over', () => {
  navigate(`/results/${code}`);
});

  useSocketEvent('room_update', (r) => {
    if (r.state === 'finished') navigate(`/results/${code}`);
  });

  const markAnswered = () => socket.emit('answer_done', { code });
  const rate = (stars) => {
    setMyRating(stars);
    socket.emit('rate_answer', { code, stars });
  };

  const isAnswerer = answerer && myId === answerer.id;

  return (
    <div className="min-h-screen px-4 py-6 flex flex-col max-w-md w-full mx-auto">
      <div className="flex justify-center mb-4">
        <Timer
          seconds={remaining}
          total={totalTime}
          size={phase === PHASE.ANSWERING && !isAnswerer ? 120 : 160}
        />
      </div>

      <p className="text-center text-white/50 text-sm mb-2">
        Раунд {roundNumber} из {totalRounds}
      </p>

      <p className="text-center text-white/70 text-sm mb-4">
        {phase === PHASE.ANSWERING && (isAnswerer ? '🎤 Отвечай вживую!' : `🎤 ${answerer?.name} отвечает вживую...`)}
        {phase === PHASE.SCORING && '⭐ Оцените ответ звёздами'}
        {phase === PHASE.IDLE && roundResult && 'Раунд завершён'}
      </p>

      <div className="flex-1 flex flex-col justify-center gap-6">
        <AnimatePresence mode="wait">
          {question && (phase === PHASE.ANSWERING || phase === PHASE.SCORING) && (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Question
                text={question.text}
                category={question.category}
                subtitle={phase === PHASE.ANSWERING ? `Отвечает: ${answerer?.name}` : undefined}
              />
            </motion.div>
          )}

          {phase === PHASE.ANSWERING && isAnswerer && (
            <motion.div
              key="answered-btn"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              <button className="btn-primary" onClick={markAnswered}>
                ✅ Я ответил(а)
              </button>
              <p className="text-center text-white/40 text-xs">
                Нажми, когда закончишь — остальные начнут ставить звёзды
              </p>
            </motion.div>
          )}

          {phase === PHASE.ANSWERING && !isAnswerer && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-white/60"
            >
              <p className="text-lg">Слушай ответ...</p>
              <p className="text-sm mt-2 text-white/40">
                Звёзды появятся, когда ответ будет завершён
              </p>
            </motion.div>
          )}

          {phase === PHASE.SCORING && (
            <motion.div
              key="scoring"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              {isAnswerer ? (
                <p className="text-center text-white/60">
                  Остальные оценивают твой ответ...
                </p>
              ) : (
                <>
                  <p className="text-center text-white/60">Сколько звёзд дашь?</p>
                  <Stars value={myRating} onChange={rate} disabled={myRating > 0} />
                  {myRating > 0 && (
                    <p className="text-center text-green-400 text-sm">
                      Ты поставил(а) {myRating} ⭐
                    </p>
                  )}
                </>
              )}
            </motion.div>
          )}

          {phase === PHASE.IDLE && roundResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <p className="text-3xl font-extrabold text-spark-gold mb-2">
                +{roundResult.totalStars} ⭐
              </p>
              <p className="text-white/60">
                {roundResult.answererName} получил(а) {roundResult.totalStars} звёзд
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {scores.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-2">
          {scores.map((s) => (
            <div
              key={s.id}
              className={`rounded-xl px-3 py-2 text-center text-sm ${
                s.id === myId ? 'bg-spark-primary/30' : 'bg-white/5'
              }`}
            >
              <p className="font-bold truncate">{s.name}</p>
              <p className="text-spark-gold font-extrabold">⭐ {s.stars}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function vibrate(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {}
}