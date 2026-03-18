import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

interface Room {
  teacherSocketId: string;
  students: string[];
  code: {
    html: string;
    css: string;
    js: string;
  };
}

const rooms: Record<string, Room> = {};

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Initialize Socket.IO on the HTTP server
let io: SocketIOServer | null = null;

export function getSocketIO(httpServer: NetServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Teacher creates a room
    socket.on('room:create', () => {
      const roomCode = generateRoomCode();
      rooms[roomCode] = {
        teacherSocketId: socket.id,
        students: [],
        code: {
          html: '<div class="container">\n  <h1>Hello World!</h1>\n  <button id="btn">Click me</button>\n</div>',
          css: '.container {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  height: 100vh;\n  font-family: sans-serif;\n}\n\nh1 {\n  color: #333;\n}\n\nbutton {\n  padding: 10px 20px;\n  font-size: 16px;\n  cursor: pointer;\n}',
          js: 'document.getElementById("btn").addEventListener("click", () => {\n  alert("Hello from the classroom!");\n});',
        },
      };
      socket.join(roomCode);
      socket.emit('room:created', roomCode);
      console.log('Room created:', roomCode);
    });

    // Student joins a room
    socket.on('room:join', (roomCode: string) => {
      const room = rooms[roomCode];
      if (!room) {
        socket.emit('room:error', 'Room not found');
        return;
      }

      room.students.push(socket.id);
      socket.join(roomCode);
      socket.emit('room:joined', roomCode);
      socket.emit('room:state', room.code);
      
      // Notify teacher that student joined
      io?.to(room.teacherSocketId).emit('student:joined', socket.id);
      console.log('Student joined room:', roomCode);
    });

    // Teacher updates code
    socket.on('code:update', (payload: { roomCode: string; html: string; css: string; js: string }) => {
      const room = rooms[payload.roomCode];
      if (!room) return;
      
      // Only teacher can update
      if (room.teacherSocketId !== socket.id) {
        socket.emit('room:error', 'Only teacher can update code');
        return;
      }

      room.code = {
        html: payload.html,
        css: payload.css,
        js: payload.js,
      };

      // Broadcast to all students in room (except teacher)
      socket.to(payload.roomCode).emit('code:sync', room.code);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Check if teacher disconnected
      for (const roomCode in rooms) {
        const room = rooms[roomCode];
        if (room.teacherSocketId === socket.id) {
          // Close room for everyone
          io?.to(roomCode).emit('room:closed', 'Teacher left the room');
          delete rooms[roomCode];
          console.log('Room closed:', roomCode);
        } else {
          // Remove student from room
          const index = room.students.indexOf(socket.id);
          if (index !== -1) {
            room.students.splice(index, 1);
            io?.to(room.teacherSocketId).emit('student:left', socket.id);
            console.log('Student left room:', roomCode);
          }
        }
      }
    });
  });

  return io;
}

export const config = {
  api: {
    bodyParser: false,
  },
};
