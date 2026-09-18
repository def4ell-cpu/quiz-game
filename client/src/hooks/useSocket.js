import { useEffect, useRef } from 'react';
import { socket } from '../socket.js';

export function useSocketEvent(event, handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const wrapped = (...args) => handlerRef.current?.(...args);
    socket.on(event, wrapped);
    return () => {
      socket.off(event, wrapped);
    };
  }, [event]);
}

export function saveSession(code, playerId) {
  localStorage.setItem('quiz_code', code);
  localStorage.setItem('quiz_playerId', playerId);
}

export function loadSession() {
  return {
    code: localStorage.getItem('quiz_code'),
    playerId: localStorage.getItem('quiz_playerId'),
  };
}

export function clearSession() {
  localStorage.removeItem('quiz_code');
  localStorage.removeItem('quiz_playerId');
}

export { socket };