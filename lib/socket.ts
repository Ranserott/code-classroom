import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || '';

export const socket: Socket = io(SOCKET_URL, {
  path: '/api/socket',
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

// Only connect on client side
if (typeof window !== 'undefined') {
  socket.connect();
}
