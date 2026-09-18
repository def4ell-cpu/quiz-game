import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://quiz-game-production-f2ee.up.railway.app';
export const socket = io(SERVER_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

socket.on('connect', () => {
  console.log('[socket] Подключён к серверу:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('[socket] Ошибка подключения:', err.message);
});