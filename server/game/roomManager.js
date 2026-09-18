// ============================================================
// roomManager.js
// ============================================================

const rooms = new Map();

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 4;

function generateRoomCode() {
  let code;
  let attempts = 0;
  do {
    code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    attempts++;
    if (attempts > 1000) throw new Error('Не удалось сгенерировать уникальный код');
  } while (rooms.has(code));
  return code;
}

function generatePlayerId() {
  return 'p_' + Math.random().toString(36).slice(2, 10);
}

function createRoom(config, hostName, hostSocketId) {
  const code = generateRoomCode();
  const hostPlayer = {
    id: generatePlayerId(),
    name: hostName.trim().slice(0, 20) || 'Игрок 1',
    socketId: hostSocketId,
    ready: false,
    stars: 0,
    connected: true,
  };

  const room = {
    code,
    hostId: hostPlayer.id,
    maxPlayers: config.maxPlayers || 2,
    questionsCount: config.questionsCount || 16,
    answerTime: config.answerTime || 60,
    mode: config.mode || 'friends', // 'friends' | 'couples'
    players: [hostPlayer],
    state: 'lobby',
    questionsQueue: [],
    currentQuestionIndex: -1,
    currentAnswererIndex: -1,
    scores: {},
    round: {
      readingEndsAt: null,
      answeringEndsAt: null,
      scoringEndsAt: null,
      currentAnswerText: null,
      submittedRatings: {},
    },
    timers: {
      tick: null,
      phase: null,
    },
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };

  rooms.set(code, room);
  return room;
}

function getRoom(code) {
  return rooms.get(code) || null;
}

function addPlayer(code, name, socketId) {
  const room = getRoom(code);
  if (!room) return { error: 'Комната не найдена' };
  if (room.state !== 'lobby') return { error: 'Игра уже началась' };
  if (room.players.length >= room.maxPlayers) return { error: 'Комната заполнена' };

  const trimmed = name.trim().slice(0, 20) || `Игрок ${room.players.length + 1}`;

  const player = {
    id: generatePlayerId(),
    name: trimmed,
    socketId,
    ready: false,
    stars: 0,
    connected: true,
  };

  room.players.push(player);
  room.lastActivity = Date.now();
  return { player, room };
}

function removePlayerBySocket(socketId) {
  for (const [code, room] of rooms.entries()) {
    const idx = room.players.findIndex((p) => p.socketId === socketId);
    if (idx !== -1) {
      const player = room.players[idx];
      player.connected = false;
      player.socketId = null;

      if (room.state === 'lobby') {
        room.players.splice(idx, 1);
        if (room.hostId === player.id && room.players.length > 0) {
          room.hostId = room.players[0].id;
        }
        if (room.players.length === 0) {
          cleanupRoom(code);
          return { code, room: null, player };
        }
      } else {
        if (room.hostId === player.id) {
          const next = room.players.find((p) => p.connected && p.id !== player.id);
          if (next) room.hostId = next.id;
        }
      }
      room.lastActivity = Date.now();
      return { code, room, player };
    }
  }
  return null;
}

function reconnectPlayer(code, playerId, socketId) {
  const room = getRoom(code);
  if (!room) return null;
  const player = room.players.find((p) => p.id === playerId);
  if (!player) return null;
  player.socketId = socketId;
  player.connected = true;
  room.lastActivity = Date.now();
  return { player, room };
}

function cleanupRoom(code) {
  const room = rooms.get(code);
  if (room?.timers?.tick) clearInterval(room.timers.tick);
  if (room?.timers?.phase) clearTimeout(room.timers.phase);
  rooms.delete(code);
}

function serializeRoom(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    maxPlayers: room.maxPlayers,
    questionsCount: room.questionsCount,
    answerTime: room.answerTime,
    mode: room.mode,
    state: room.state,
    currentAnswererIndex: room.currentAnswererIndex,
    currentQuestionIndex: room.currentQuestionIndex,
    currentAnswerText: room.round.currentAnswerText,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      ready: p.ready,
      stars: p.stars,
      connected: p.connected,
    })),
  };
}

function startCleanupInterval() {
  setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms.entries()) {
      if (now - room.lastActivity > 30 * 60 * 1000) {
        console.log(`[cleanup] Удаляю неактивную комнату ${code}`);
        cleanupRoom(code);
      }
    }
  }, 60 * 1000);
}

module.exports = {
  createRoom,
  getRoom,
  addPlayer,
  removePlayerBySocket,
  reconnectPlayer,
  cleanupRoom,
  serializeRoom,
  generatePlayerId,
  startCleanupInterval,
  rooms,
};