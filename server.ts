import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';

declare global {
  // eslint-disable-next-line no-var
  var io: SocketIOServer | undefined;
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

function updateParticipantCount(io: SocketIOServer, room: string) {
  const roomSet = io.sockets.adapter.rooms.get(room);
  const count = roomSet ? roomSet.size : 0;
  io.to(room).emit('participant:count', count);
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  const io = new SocketIOServer(httpServer, {
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

  // Make io globally accessible to API routes
  globalThis.io = io;

  io.on('connection', (socket) => {
    let currentSessionRoom: string | null = null;

    socket.on('join:session', async (sessionCode: string) => {
      // Leave previous room if any
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
        // Slight delay so room size reflects disconnect
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

  httpServer
    .once('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> LivePoll ready on http://localhost:${port}`);
      console.log(`> Mode: ${dev ? 'development' : 'production'}`);
    });
});
