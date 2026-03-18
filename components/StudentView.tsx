'use client';

import { useState, useEffect } from 'react';
import { LogOut, Code, Wifi, WifiOff, Eye, FileCode, MonitorPlay } from 'lucide-react';

interface StudentViewProps {
  roomCode: string;
  onGoHome: () => void;
}

export default function StudentView({ roomCode, onGoHome }: StudentViewProps) {
  const [html, setHtml] = useState(`<div class="container">
  <h1>Hello World!</h1>
  <button id="btn">Click me</button>
</div>`);
  
  const [css, setCss] = useState(`.container {
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
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
}`);
  
  const [js, setJs] = useState(`document.getElementById("btn").addEventListener("click", () => {
  alert("Hello from the classroom!");
});`);

  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('preview');
  const [activeCodeTab, setActiveCodeTab] = useState<'html' | 'css' | 'js'>('html');

  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        ${html}
        <script>${js}<\/script>
      </body>
    </html>
  `;

  // Connect to SSE endpoint
  useEffect(() => {
    let eventSource: EventSource | null = null;
    
    const connect = () => {
      eventSource = new EventSource('/api/code?stream=true');
      
      eventSource.onopen = () => {
        setIsConnected(true);
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.html) setHtml(data.html);
          if (data.css) setCss(data.css);
          if (data.js) setJs(data.js);
          setLastUpdate(new Date());
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };
      
      eventSource.onerror = () => {
        setIsConnected(false);
        setTimeout(() => {
          if (eventSource) {
            eventSource.close();
          }
          connect();
        }, 3000);
      };
    };
    
    connect();
    
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const getCodeContent = () => {
    switch (activeCodeTab) {
      case 'html': return html;
      case 'css': return css;
      case 'js': return js;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">Code Classroom</h1>
            <div className="h-6 w-px bg-zinc-700" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">Room:</span>
              <code className="px-2 py-0.5 bg-zinc-800 rounded text-sm font-mono text-purple-400">
                {roomCode}
              </code>
            </div>
            <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded">
              Student View
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              isConnected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-sm">{isConnected ? 'Live' : 'Reconnecting...'}</span>
            </div>

            {lastUpdate && (
              <span className="text-xs text-zinc-500">
                Updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}

            <button
              onClick={onGoHome}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Leave
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <main className="h-[calc(100vh-64px)] flex">
        {/* Left Side - Code */}
        <div className="w-1/2 flex flex-col border-r border-zinc-800">
          {/* Code Tabs */}
          <div className="flex border-b border-zinc-800 bg-zinc-900/50">
            {(['html', 'css', 'js'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveCodeTab(tab)}
                className={`px-6 py-3 text-sm font-medium border-r border-zinc-800 transition-colors ${
                  activeCodeTab === tab
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  {tab.toUpperCase()}
                </div>
              </button>
            ))}
          </div>

          {/* Code Display */}
          <div className="flex-1 bg-zinc-900/30 p-4 overflow-auto">
            <pre className="text-sm font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {getCodeContent()}
            </pre>
          </div>
        </div>

        {/* Right Side - Preview */}
        <div className="w-1/2 flex flex-col">
          {/* Preview Header */}
          <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MonitorPlay className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-300">Live Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Updated {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}</span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 bg-white">
            <iframe
              srcDoc={srcDoc}
              className="w-full h-full border-0"
              sandbox="allow-scripts"
              title="Student Preview"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
