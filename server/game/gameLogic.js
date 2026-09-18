// ============================================================
// gameLogic.js
// Без фазы чтения, без текстового ответа (вживую).
// Поддержка двух режимов: friends / couples.
// ============================================================

const { getRoom, serializeRoom } = require('./roomManager');

const questionsFriends = require('../data/questions-friends.json');
const questionsCouples = require('../data/questions-couples.json');

const SCORING_TIME = 20;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Подгонка количества вопросов, чтоб делилось на игроков поровну
function adjustQuestionsCount(requested, playersCount) {
  if (playersCount <= 0) return requested;
  const perPlayer = Math.floor(requested / playersCount);
  return perPlayer * playersCount;
}

function getQuestionsPool(mode) {
  if (mode === 'couples') return questionsCouples;
  return questionsFriends;
}

function startGame(io, code) {
  const room = getRoom(code);
  if (!room) return;
  if (room.state !== 'lobby') return;
  if (room.players.length < 2) return;

  const adjusted = adjustQuestionsCount(room.questionsCount, room.players.length);
  room.questionsCount = adjusted;

  const pool = shuffle(getQuestionsPool(room.mode || 'friends'));
  room.questionsQueue = pool.slice(0, Math.min(adjusted, pool.length));
  room.currentQuestionIndex = -1;

room.currentAnswererIndex = Math.floor(Math.random() * room.players.length) - 1;
  room.players.forEach((p) => (p.stars = 0));
  room.players.forEach((p) => (p.ready = false));

  room.state = 'answering';
  io.to(code).emit('room_update', serializeRoom(room));

  startNextRound(io, code);
}

function startNextRound(io, code) {
  const room = getRoom(code);
  if (!room) return;

  room.currentQuestionIndex++;

  if (room.currentQuestionIndex >= room.questionsQueue.length) {
    return finishGame(io, code);
  }

room.currentAnswererIndex = (room.currentAnswererIndex + 1 + room.players.length) % room.players.length;  room.round.submittedRatings = {};

  const question = room.questionsQueue[room.currentQuestionIndex];
  const answerer = room.players[room.currentAnswererIndex];

  room.state = 'answering';
  io.to(code).emit('room_update', serializeRoom(room));

  io.to(code).emit('question_start', {
    questionText: question.text,
    category: question.category,
    answererId: answerer.id,
    answererName: answerer.name,
    duration: room.answerTime,
    roundNumber: room.currentQuestionIndex + 1,
    totalRounds: room.questionsQueue.length,
  });

  startTick(io, code, room.answerTime);

  room.timers.phase = setTimeout(() => {
    if (room.state === 'answering') {
      startScoringPhase(io, code);
    }
  }, room.answerTime * 1000);
}

function moveToScoring(io, code, playerId) {
  const room = getRoom(code);
  if (!room) return;
  if (room.state !== 'answering') return;

  const answerer = room.players[room.currentAnswererIndex];
  if (!answerer || answerer.id !== playerId) return;

  if (room.timers.phase) clearTimeout(room.timers.phase);
  stopTick(room);
  startScoringPhase(io, code);
}

function startScoringPhase(io, code) {
  const room = getRoom(code);
  if (!room) return;

  room.state = 'scoring';
  room.round.submittedRatings = {};

  const answerer = room.players[room.currentAnswererIndex];
  io.to(code).emit('room_update', serializeRoom(room));

  io.to(code).emit('scoring_phase', {
    answererId: answerer.id,
    answererName: answerer.name,
    duration: SCORING_TIME,
  });

  startTick(io, code, SCORING_TIME);

  room.timers.phase = setTimeout(() => {
    if (room.state === 'scoring') {
      finalizeRound(io, code);
    }
  }, SCORING_TIME * 1000);
}

function rateAnswer(io, code, raterId, stars) {
  const room = getRoom(code);
  if (!room) return;
  if (room.state !== 'scoring') return;

  const answerer = room.players[room.currentAnswererIndex];
  if (!answerer) return;
  if (raterId === answerer.id) return;
  if (room.round.submittedRatings[raterId] !== undefined) return;

  const value = Math.max(1, Math.min(5, Math.round(Number(stars) || 0)));
  room.round.submittedRatings[raterId] = value;

  const raters = room.players.filter((p) => p.id !== answerer.id && p.connected);
  const allRated = raters.every((p) => room.round.submittedRatings[p.id] !== undefined);

  io.to(code).emit('rating_received', {
    raterId,
    ratedCount: Object.keys(room.round.submittedRatings).length,
    totalRaters: raters.length,
  });

  if (allRated) {
    if (room.timers.phase) clearTimeout(room.timers.phase);
    stopTick(room);
    finalizeRound(io, code);
  }
}

function finalizeRound(io, code) {
  const room = getRoom(code);
  if (!room) return;

  const answerer = room.players[room.currentAnswererIndex];
  if (!answerer) return;

  const ratings = room.round.submittedRatings;
  const totalStars = Object.values(ratings).reduce((sum, v) => sum + v, 0);

  answerer.stars += totalStars;

  io.to(code).emit('round_result', {
    answererId: answerer.id,
    answererName: answerer.name,
    ratings,
    totalStars,
    scores: room.players.map((p) => ({ id: p.id, name: p.name, stars: p.stars })),
  });

  room.state = 'reading';

  room.timers.phase = setTimeout(() => {
    startNextRound(io, code);
  }, 2000);
}

function finishGame(io, code) {
  const room = getRoom(code);
  if (!room) return;

  room.state = 'finished';

  const sorted = [...room.players].sort((a, b) => b.stars - a.stars);
  const winner = sorted[0];

  io.to(code).emit('game_over', {
    winner: winner ? { id: winner.id, name: winner.name, stars: winner.stars } : null,
    scores: sorted.map((p) => ({ id: p.id, name: p.name, stars: p.stars })),
  });

  io.to(code).emit('room_update', serializeRoom(room));
}

function resetRoom(io, code) {
  const room = getRoom(code);
  if (!room) return;

  if (room.timers.tick) clearInterval(room.timers.tick);
  if (room.timers.phase) clearTimeout(room.timers.phase);

  room.state = 'lobby';
  room.questionsQueue = [];
  room.currentQuestionIndex = -1;
  room.currentAnswererIndex = -1;
  room.round = {
    readingEndsAt: null,
    answeringEndsAt: null,
    scoringEndsAt: null,
    currentAnswerText: null,
    submittedRatings: {},
  };
  room.players.forEach((p) => {
    p.stars = 0;
    p.ready = false;
  });

  io.to(code).emit('room_update', serializeRoom(room));
}

function startTick(io, code, seconds) {
  const room = getRoom(code);
  if (!room) return;
  stopTick(room);

  let remaining = seconds;
  room.timers.tick = setInterval(() => {
    remaining--;
    const r = getRoom(code);
    if (!r) return stopTick(room);
    io.to(code).emit('timer_tick', { remaining: Math.max(0, remaining) });
    if (remaining <= 0) stopTick(r);
  }, 1000);
}

function stopTick(room) {
  if (room?.timers?.tick) {
    clearInterval(room.timers.tick);
    room.timers.tick = null;
  }
}

module.exports = {
  startGame,
  startNextRound,
  moveToScoring,
  rateAnswer,
  finishGame,
  resetRoom,
  stopTick,
};