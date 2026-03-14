'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket || socket.disconnected) {
    // Initialise the server-side Socket.io handler before connecting
    fetch('/api/socket').catch(() => {});

    socket = io({
      path: '/api/socket',
      addTrailingSlash: false,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      console.log('[socket] connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[socket] disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[socket] connection error:', err.message);
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
