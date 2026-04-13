'use client';

import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { LogOut, Wifi, WifiOff, Play, Terminal, Loader2 } from 'lucide-react';

interface PythonStudentViewProps {
  roomCode: string;
  onGoHome: () => void;
}

declare global {
  interface Window {
    loadPyodide: any;
  }
}

export default function PythonStudentView({ roomCode, onGoHome }: PythonStudentViewProps) {
  const [pythonCode, setPythonCode] = useState(`# Esperando código del profesor...
import pandas as pd

df = pd.DataFrame({
    'nombre': ['Ana', 'Luis', 'María'],
    'edad': [23, 25, 30]
})

print(df)
`);

  const [output, setOutput] = useState<Array<{ type: 'stdout' | 'stderr' | 'html'; content: string }>>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [pyodideLoading, setPyodideLoading] = useState(true);

  const pyodideRef = useRef<any>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Load Pyodide
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
    script.async = true;
    script.onload = async () => {
      try {
        pyodideRef.current = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
        });
        await pyodideRef.current.runPythonAsync(`
import pandas as pd
import sys
from io import StringIO
        `);
        setPyodideReady(true);
      } catch (err) {
        console.error('Pyodide failed to load:', err);
      } finally {
        setPyodideLoading(false);
      }
    };
    script.onerror = () => setPyodideLoading(false);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Connect to SSE
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connect = () => {
      eventSource = new EventSource(`/api/code?stream=true&room=${roomCode}`);

      eventSource.onopen = () => setIsConnected(true);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.pythonCode) setPythonCode(data.pythonCode);
          setLastUpdate(new Date());
          // Auto-run when code updates
          if (data.pythonCode && pyodideReady) {
            runCode(data.pythonCode);
          }
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
      if (eventSource) eventSource.close();
    };
  }, [roomCode, pyodideReady]);

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const runCode = async (codeOverride?: string) => {
    const code = codeOverride || pythonCode;
    if (!pyodideReady || isRunning) return;

    setIsRunning(true);
    setOutput([]);

    try {
      const pyodide = pyodideRef.current;

      await pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
      `);

      let hasError = false;
      try {
        await pyodide.runPythonAsync(code);
      } catch (err: any) {
        hasError = true;
        setOutput(prev => [...prev, { type: 'stderr', content: err.message || String(err) }]);
      }

      const stdout = await pyodide.runPythonAsync(`sys.stdout.getvalue()`);
      if (stdout) {
        stdout.split('\n').filter((line: string) => line.trim()).forEach((line: string) => {
          setOutput(prev => [...prev, { type: 'stdout', content: line }]);
        });
      }

      if (!hasError) {
        try {
          const lastLine = code.trim().split('\n').filter((l: string) => !l.trim().startsWith('#')).pop() || '';
          const varName = lastLine.split('=')[0]?.trim();
          if (varName && varName !== 'import' && !varName.includes('print')) {
            const hasHtml = await pyodide.runPythonAsync(`
try:
    _result = ${varName}
    hasattr(_result, '_repr_html_')
except:
    False
            `);
            if (hasHtml) {
              const htmlResult = await pyodide.runPythonAsync(`
try:
    _result = ${varName}
    _result._repr_html_()
except Exception as e:
    str(e)
              `);
              if (htmlResult && !htmlResult.includes('Error')) {
                setOutput(prev => [...prev, { type: 'html', content: htmlResult }]);
              }
            }
          }
        } catch { /* no interactive output */ }
      }

      await pyodide.runPythonAsync(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
      `);
    } catch (err: any) {
      setOutput(prev => [...prev, { type: 'stderr', content: err.message || String(err) }]);
    } finally {
      setIsRunning(false);
    }
  };

  const clearOutput = () => setOutput([]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">Aula de Código</h1>
            <div className="h-6 w-px bg-zinc-700" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">Sala:</span>
              <code className="px-2 py-0.5 bg-zinc-800 rounded text-sm font-mono text-purple-400">
                {roomCode}
              </code>
            </div>
            <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded">
              Vista Estudiante
            </span>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
              Python
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              isConnected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-sm">{isConnected ? 'En vivo' : 'Reconectando...'}</span>
            </div>

            {lastUpdate && (
              <span className="text-xs text-zinc-500">
                Actualizado: {lastUpdate.toLocaleTimeString()}
              </span>
            )}

            <button
              onClick={onGoHome}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Pyodide loading */}
      {pyodideLoading && (
        <div className="bg-blue-500/10 border-b border-blue-500/30 px-4 py-2 flex items-center gap-2 text-blue-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading Python runtime...
        </div>
      )}

      {/* Main Content */}
      <main className="flex h-[calc(100vh-64px)]">
        {/* Left Side - Monaco Editor (Read Only) */}
        <div className="w-1/2 flex flex-col border-r border-zinc-800">
          {/* Editor Header */}
          <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-300">Python</span>
            {pyodideReady && (
              <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded">Runtime Ready</span>
            )}
          </div>

          {/* Monaco Editor - Read Only */}
          <div className="flex-1">
            <Editor
              height="100%"
              language="python"
              value={pythonCode}
              options={{
                readOnly: true,
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

        {/* Right Side - Output */}
        <div className="w-1/2 flex flex-col">
          {/* Output Header */}
          <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-300">Output</span>
              {output.length > 0 && (
                <span className="text-xs text-zinc-500">{output.length} lines</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {pyodideReady && (
                <button
                  onClick={() => runCode()}
                  disabled={isRunning}
                  className="flex items-center gap-1 px-3 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {isRunning ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                  Run locally
                </button>
              )}
              <button
                onClick={clearOutput}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Output Content */}
          <div ref={outputRef} className="flex-1 bg-zinc-950 overflow-auto font-mono text-sm">
            {output.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                <Terminal className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">Esperando código del profesor...</p>
                <p className="text-xs mt-1">Se ejecutará automáticamente al recibir updates</p>
              </div>
            ) : (
              <div className="p-4 space-y-1">
                {output.map((line, i) => {
                  if (line.type === 'html') {
                    return (
                      <div key={i} className="py-2 overflow-x-auto">
                        <style>{`
                          .pandas-output table { border-collapse: collapse; width: 100%; margin: 8px 0; }
                          .pandas-output th { background: #334155; color: #f1f5f9; padding: 6px 12px; text-align: left; font-size: 12px; }
                          .pandas-output td { padding: 6px 12px; border-bottom: 1px solid #334155; font-size: 13px; }
                          .pandas-output tr:hover { background: #1e293b; }
                        `}</style>
                        <div
                          className="pandas-output"
                          dangerouslySetInnerHTML={{ __html: line.content }}
                        />
                      </div>
                    );
                  }

                  const isError = line.type === 'stderr';
                  return (
                    <div
                      key={i}
                      className={isError ? 'text-red-400 bg-red-500/10 px-2 py-0.5 rounded' : 'text-zinc-300'}
                    >
                      {isError && <span className="mr-2">✕</span>}
                      {line.content}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
