// server.js - Express backend for SSE
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Next.js app
const nextApp = next({ dev, hostname, port });
const handle = nextApp.getRequestHandler();

// In-memory storage for room code
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
const clients = new Set();

nextApp.prepare().then(() => {
  const server = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname, query } = parsedUrl;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // SSE endpoint for students to receive updates
    if (pathname === '/api/code/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      // Send initial code
      res.write(`data: ${JSON.stringify(currentCode)}\n\n`);

      // Add client to set
      clients.add(res);

      // Remove client on close
      req.on('close', () => {
        clients.delete(res);
      });

      return;
    }

    // POST endpoint for teacher to update code
    if (pathname === '/api/code' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          currentCode = {
            html: data.html || currentCode.html,
            css: data.css || currentCode.css,
            js: data.js || currentCode.js,
            timestamp: Date.now()
          };

          // Broadcast to all connected clients
          const message = `data: ${JSON.stringify(currentCode)}\n\n`;
          clients.forEach(client => {
            client.write(message);
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, timestamp: currentCode.timestamp }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
      return;
    }

    // Let Next.js handle all other routes
    handle(req, res, parsedUrl);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
