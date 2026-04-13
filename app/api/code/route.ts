// app/api/code/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface RoomState {
  mode: 'web' | 'python';
  html: string;
  css: string;
  js: string;
  pythonCode: string;
  timestamp: number;
}

// In-memory room storage (roomCode -> RoomState)
const rooms = new Map<string, RoomState>();

// SSE clients per room (roomCode -> Set of controllers)
const roomClients = new Map<string, Set<ReadableStreamDefaultController>>();

const defaultWebCode = {
  html: `<div class="container">
  <h1>Hello World!</h1>
  <button id="btn">Click me</button>
</div>`,
  css: `.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-family: sans-serif;
}

h1 {
  color: #333;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}`,
  js: `document.getElementById("btn").addEventListener("click", () => {
  alert("Hello from the classroom!");
});`,
};

const defaultPythonCode = `# Escribe tu código Python aquí
import pandas as pd

# Ejemplo con pandas
df = pd.DataFrame({
    'nombre': ['Ana', 'Luis', 'María'],
    'edad': [23, 25, 30]
})

print("DataFrame creado:")
print(df)
`;

function getOrCreateRoom(roomCode: string): RoomState {
  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, {
      mode: 'web',
      ...defaultWebCode,
      pythonCode: defaultPythonCode,
      timestamp: Date.now(),
    });
  }
  return rooms.get(roomCode)!;
}

function getRoomClients(roomCode: string): Set<ReadableStreamDefaultController> {
  if (!roomClients.has(roomCode)) {
    roomClients.set(roomCode, new Set());
  }
  return roomClients.get(roomCode)!;
}

function broadcastToRoom(roomCode: string, data: RoomState) {
  const clients = getRoomClients(roomCode);
  const message = `data: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(message);

  clients.forEach(controller => {
    try {
      controller.enqueue(encoded);
    } catch {
      // Client disconnected, will be cleaned up
    }
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomCode = searchParams.get('room') || 'default';
  const isStream = searchParams.get('stream') === 'true';

  if (isStream) {
    const room = getOrCreateRoom(roomCode);

    const stream = new ReadableStream({
      start(controller) {
        // Send initial room state
        const data = `data: ${JSON.stringify(room)}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));

        // Add to room clients
        const clients = getRoomClients(roomCode);
        clients.add(controller);

        // Clean up on close
        request.signal.addEventListener('abort', () => {
          clients.delete(controller);
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  // Regular GET - return room state
  const room = getOrCreateRoom(roomCode);
  return NextResponse.json(room);
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const roomCode = data.roomCode || 'default';

    const room = getOrCreateRoom(roomCode);

    // Update mode if provided
    if (data.mode) {
      room.mode = data.mode;
    }

    // Update code based on mode
    if (data.mode === 'python') {
      room.pythonCode = data.pythonCode || room.pythonCode;
    } else {
      // Web mode (default)
      room.html = data.html ?? room.html;
      room.css = data.css ?? room.css;
      room.js = data.js ?? room.js;
      room.pythonCode = data.pythonCode ?? room.pythonCode;
    }

    room.timestamp = Date.now();

    // Broadcast to clients in this room
    broadcastToRoom(roomCode, room);

    return NextResponse.json({ success: true, timestamp: room.timestamp, mode: room.mode });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}
