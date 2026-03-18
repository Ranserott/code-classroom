// app/api/code/route.ts
import { NextRequest, NextResponse } from 'next/server';

// In-memory storage (in production, use Redis or database)
let currentCode = {
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
  timestamp: Date.now()
};

// Connected clients for SSE
const clients = new Set<ReadableStreamDefaultController>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  if (searchParams.get('stream') === 'true') {
    // SSE endpoint
    const stream = new ReadableStream({
      start(controller) {
        // Send initial code
        const data = `data: ${JSON.stringify(currentCode)}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
        
        // Add to clients
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
  
  // Regular GET - return current code
  return NextResponse.json(currentCode);
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    currentCode = {
      html: data.html || currentCode.html,
      css: data.css || currentCode.css,
      js: data.js || currentCode.js,
      timestamp: Date.now()
    };
    
    // Broadcast to all connected clients
    const message = `data: ${JSON.stringify(currentCode)}\n\n`;
    const encoded = new TextEncoder().encode(message);
    
    clients.forEach(controller => {
      try {
        controller.enqueue(encoded);
      } catch (e) {
        // Client disconnected, will be cleaned up
      }
    });
    
    return NextResponse.json({ success: true, timestamp: currentCode.timestamp });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}
