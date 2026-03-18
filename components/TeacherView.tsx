'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Copy, Check, Play, Code, Eye, LogOut, Rocket } from 'lucide-react';

interface TeacherViewProps {
  roomCode: string;
  onGoHome: () => void;
}

export default function TeacherView({ roomCode, onGoHome }: TeacherViewProps) {
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
}`);
  
  const [js, setJs] = useState(`document.getElementById("btn").addEventListener("click", () => {
  alert("Hello from the classroom!");
});`);

  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'idle' | 'success' | 'error'>('idle');

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

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeployStatus('idle');
    
    try {
      const response = await fetch('/api/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html,
          css,
          js,
        }),
      });

      if (response.ok) {
        setDeployStatus('success');
        // Show preview after successful deploy
        setShowPreview(true);
      } else {
        setDeployStatus('error');
      }
    } catch (error) {
      console.error('Deploy error:', error);
      setDeployStatus('error');
    } finally {
      setIsDeploying(false);
      // Clear status after 3 seconds
      setTimeout(() => setDeployStatus('idle'), 3000);
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
              <code className="px-2 py-0.5 bg-zinc-800 rounded text-sm font-mono">
                {roomCode}
              </code>
              <button
                onClick={copyRoomCode}
                className="p-1 hover:bg-zinc-700 rounded transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-zinc-400" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Deploy Button */}
            <button
              onClick={handleDeploy}
              disabled={isDeploying}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                deployStatus === 'success'
                  ? 'bg-green-600 text-white'
                  : deployStatus === 'error'
                  ? 'bg-red-600 text-white'
                  : isDeploying
                  ? 'bg-zinc-700 text-zinc-400 cursor-wait'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isDeploying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deploying...
                </>
              ) : deployStatus === 'success' ? (
                <>
                  <Check className="w-4 h-4" />
                  Deployed!
                </>
              ) : deployStatus === 'error' ? (
                <>
                  <span className="w-4 h-4">!</span>
                  Failed
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Deploy
                </>
              )}
            </button>

            <button
              onClick={togglePreview}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                showPreview 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {showPreview ? <Eye className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {showPreview ? 'Hide' : 'Show'}
            </button>
            <button
              onClick={onGoHome}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Leave
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex h-[calc(100vh-64px)]">
        {/* Editor Section */}
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} flex flex-col`}>
          {/* Tabs */}
          <div className="flex border-b border-zinc-800 bg-zinc-900/50">
            {(['html', 'css', 'js'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium border-r border-zinc-800 transition-colors ${
                  activeTab === tab
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={activeTab === 'js' ? 'javascript' : activeTab}
              value={activeTab === 'html' ? html : activeTab === 'css' ? css : js}
              onChange={(value) => {
                if (activeTab === 'html') setHtml(value || '');
                else if (activeTab === 'css') setCss(value || '');
                else setJs(value || '');
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                theme: 'vs-dark',
              }}
            />
          </div>
        </div>

        {/* Preview Section */}
        {showPreview && (
          <div className="w-1/2 border-l border-zinc-800 flex flex-col">
            <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">Preview</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Live</span>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
            <div className="flex-1 bg-white">
              <iframe
                srcDoc={srcDoc}
                className="w-full h-full border-0"
                sandbox="allow-scripts"
                title="Preview"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
