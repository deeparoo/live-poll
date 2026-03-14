import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';
import { Server as SocketIOServer } from 'socket.io';

type NextApiResponseWithSocket = NextApiResponse & {
  socket: NetSocket & {
    server: HTTPServer & {
      io?: SocketIOServer;
    };
  };
};

declare global {
  // eslint-disable-next-line no-var
  var io: SocketIOServer | undefined;
}

function updateParticipantCount(io: SocketIOServer, room: string) {
  const roomSet = io.sockets.adapter.rooms.get(room);
  const count = roomSet ? roomSet.size : 0;
  io.to(room).emit('participant:count', count);
}

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
      // Tuned for 600 concurrent users
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6,
      connectTimeout: 45000,
    });

    res.socket.server.io = io;
    globalThis.io = io;

    io.on('connection', (socket) => {
      let currentSessionRoom: string | null = null;

      socket.on('join:session', async (sessionCode: string) => {
        if (currentSessionRoom) {
          socket.leave(currentSessionRoom);
          updateParticipantCount(io, currentSessionRoom);
        }

        const room = `session:${sessionCode}`;
        currentSessionRoom = room;
        await socket.join(room);
        updateParticipantCount(io, room);
      });

      socket.on('disconnect', () => {
        if (currentSessionRoom) {
          setTimeout(() => {
            if (currentSessionRoom) {
              updateParticipantCount(io, currentSessionRoom);
            }
          }, 150);
        }
      });

      socket.on('error', (err) => {
        console.error('Socket error:', err);
      });
    });

    console.log('[socket] Socket.io server initialised on /api/socket');
  }

  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};
