// ============================================================
// handlers.js
// ============================================================

const {
  createRoom,
  getRoom,
  addPlayer,
  removePlayerBySocket,
  reconnectPlayer,
  serializeRoom,
} = require('../game/roomManager');

const {
  startGame,
  moveToScoring,
  rateAnswer,
  resetRoom,
} = require('../game/gameLogic');

function registerHandlers(io, socket) {
  console.log(`[socket] Подключился: ${socket.id}`);

  socket.on('create_room', ({ name, maxPlayers, questionsCount, answerTime, mode }) => {
    try {
      if (!name || typeof name !== 'string') {
        return socket.emit('error_message', { text: 'Введите имя' });
      }
      const room = createRoom(
        { maxPlayers, questionsCount, answerTime, mode },
        name,
        socket.id
      );
      const host = room.players[0];

      socket.join(room.code);

      socket.emit('room_created', { code: room.code, playerId: host.id });
      io.to(room.code).emit('room_update', serializeRoom(room));
      console.log(`[room] Создана ${room.code} хостом ${host.name} (режим: ${room.mode})`);
    } catch (e) {
      console.error(e);
      socket.emit('error_message', { text: 'Не удалось создать комнату' });
    }
  });

  socket.on('join_room', ({ code, name }) => {
    try {
      if (!code || !name) {
        return socket.emit('error_message', { text: 'Введите имя и код' });
      }
      const normalized = String(code).toUpperCase().trim();
      const result = addPlayer(normalized, name, socket.id);
      if (result.error) {
        return socket.emit('error_message', { text: result.error });
      }
      const { player, room } = result;
      socket.join(room.code);
      socket.emit('room_joined', { code: room.code, playerId: player.id });
      io.to(room.code).emit('room_update', serializeRoom(room));
      console.log(`[room] ${player.name} присоединился к ${room.code}`);
    } catch (e) {
      console.error(e);
      socket.emit('error_message', { text: 'Ошибка при входе' });
    }
  });

  socket.on('reconnect_player', ({ code, playerId }) => {
    try {
      const normalized = String(code).toUpperCase().trim();
      const result = reconnectPlayer(normalized, playerId, socket.id);
      if (!result) {
        return socket.emit('error_message', { text: 'Не удалось восстановить сессию' });
      }
      const { room } = result;
      socket.join(room.code);
      socket.emit('room_joined', { code: room.code, playerId });
      io.to(room.code).emit('room_update', serializeRoom(room));
      console.log(`[room] ${playerId} переподключился к ${room.code}`);
    } catch (e) {
      console.error(e);
    }
  });

  socket.on('toggle_ready', ({ code }) => {
    const room = getRoom(code);
    if (!room || room.state !== 'lobby') return;
    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;
    player.ready = !player.ready;
    io.to(code).emit('room_update', serializeRoom(room));
  });

  socket.on('start_game', ({ code }) => {
    const room = getRoom(code);
    if (!room) return;
    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player || player.id !== room.hostId) return;
    if (room.players.length < 2) {
      return socket.emit('error_message', { text: 'Нужно минимум 2 игрока' });
    }
    const allReady = room.players.every((p) => p.ready);
    if (!allReady) {
      return socket.emit('error_message', { text: 'Не все игроки готовы' });
    }
    startGame(io, code);
  });

  // Отвечающий закончил отвечать вживую — жмёт кнопку
  socket.on('answer_done', ({ code }) => {
    const room = getRoom(code);
    if (!room) return;
    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;
    moveToScoring(io, code, player.id);
  });

  socket.on('rate_answer', ({ code, stars }) => {
    const room = getRoom(code);
    if (!room) return;
    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;
    rateAnswer(io, code, player.id, stars);
  });

  socket.on('play_again', ({ code }) => {
  const room = getRoom(code);
  if (!room) return;
  const player = room.players.find((p) => p.socketId === socket.id);
  if (!player) return;
  resetRoom(io, code);
});

  socket.on('disconnect', () => {
    console.log(`[socket] Отключился: ${socket.id}`);
    const result = removePlayerBySocket(socket.id);
    if (result && result.room) {
      io.to(result.code).emit('room_update', serializeRoom(result.room));
    }
  });
}

module.exports = { registerHandlers };