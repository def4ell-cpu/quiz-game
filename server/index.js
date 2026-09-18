// ============================================================
// index.js — точка входа сервера
// Express (HTTP) + Socket.IO (realtime) + CORS
// ============================================================

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const { registerHandlers } = require('./socket/handlers');
const { startCleanupInterval } = require('./game/roomManager');

const PORT = process.env.PORT || 4000;

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'quiz-sparks-server' });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  registerHandlers(io, socket);
});

startCleanupInterval();

server.listen(PORT, () => {
  console.log(`🚀 Quiz Sparks server запущен на порту ${PORT}`);
  console.log(`   CORS разрешён для: ${CLIENT_ORIGIN}`);
});