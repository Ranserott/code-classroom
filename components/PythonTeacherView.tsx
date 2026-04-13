'use client';

import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Copy, Check, Play, LogOut, Loader2, Terminal, Rocket } from 'lucide-react';

interface PythonTeacherViewProps {
  roomCode: string;
  onGoHome: () => void;
}

declare global {
  interface Window {
    loadPyodide: any;
  }
}

export default function PythonTeacherView({ roomCode, onGoHome }: PythonTeacherViewProps) {
  const [pythonCode, setPythonCode] = useState(`import pandas as pd

# Ejemplo con pandas
df = pd.DataFrame({
    'nombre': ['Ana', 'Luis', 'María'],
    'edad': [23, 25, 30]
})

print("DataFrame creado:")
print(df)
`);

  const [output, setOutput] = useState<Array<{ type: 'stdout' | 'stderr' | 'html'; content: string }>>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [pyodideLoading, setPyodideLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'idle' | 'success' | 'error'>('idle');

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
        // Pre-import pandas
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
    script.onerror = () => {
      setPyodideLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runCode = async () => {
    if (!pyodideReady || isRunning) return;

    setIsRunning(true);
    setOutput([]);

    try {
      const pyodide = pyodideRef.current;

      // Redirect stdout and stderr
      await pyodide.runPythonAsync(`
import sys
from io import StringIO

sys.stdout = StringIO()
sys.stderr = StringIO()
      `);

      // Run user code
      let hasError = false;
      try {
        await pyodide.runPythonAsync(pythonCode);
      } catch (err: any) {
        hasError = true;
        const errorMsg = err.message || String(err);
        setOutput(prev => [...prev, { type: 'stderr', content: errorMsg }]);
      }

      // Capture stdout
      const stdout = await pyodide.runPythonAsync(`sys.stdout.getvalue()`);
      if (stdout) {
        const lines = stdout.split('\n').filter((line: string) => line.trim() !== '');
        lines.forEach((line: string) => {
          setOutput(prev => [...prev, { type: 'stdout', content: line }]);
        });
      }

      // Capture stderr
      const stderr = await pyodide.runPythonAsync(`sys.stderr.getvalue()`);
      if (stderr && !hasError) {
        const lines = stderr.split('\n').filter((line: string) => line.trim() !== '');
        lines.forEach((line: string) => {
          setOutput(prev => [...prev, { type: 'stderr', content: line }]);
        });
      }

      // Try to get the last expression result as HTML (for DataFrames, etc.)
      if (!hasError) {
        try {
          const lastLine = pythonCode.trim().split('\n').filter((l: string) => !l.trim().startsWith('#')).pop() || '';
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
        } catch {
          // Ignore - no interactive output for this expression
        }
      }

      // Restore stdout/stderr
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

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeployStatus('idle');

    try {
      const response = await fetch('/api/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          mode: 'python',
          pythonCode,
        }),
      });

      if (response.ok) {
        setDeployStatus('success');
      } else {
        setDeployStatus('error');
      }
    } catch {
      setDeployStatus('error');
    } finally {
      setIsDeploying(false);
      setTimeout(() => setDeployStatus('idle'), 3000);
    }
  };

  const clearOutput = () => setOutput([]);

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
              <code className="px-2 py-0.5 bg-zinc-800 rounded text-sm font-mono text-blue-400">
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
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
              Python
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Run Button */}
            <button
              onClick={runCode}
              disabled={!pyodideReady || isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run
                </>
              )}
            </button>

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
                  : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg'
              }`}
            >
              {isDeploying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Syncing...
                </>
              ) : deployStatus === 'success' ? (
                <>
                  <Check className="w-4 h-4" />
                  Synced!
                </>
              ) : deployStatus === 'error' ? (
                <>
                  <span className="w-4 h-4">!</span>
                  Failed
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Sync to Students
                </>
              )}
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

      {/* Pyodide loading indicator */}
      {pyodideLoading && (
        <div className="bg-blue-500/10 border-b border-blue-500/30 px-4 py-2 flex items-center gap-2 text-blue-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading Python runtime (Pyodide)...
        </div>
      )}

      {/* Main Content */}
      <main className="flex h-[calc(100vh-64px)]">
        {/* Editor Section */}
        <div className="w-1/2 flex flex-col border-r border-zinc-800">
          {/* Editor Header */}
          <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-300">Python</span>
            {pyodideReady && (
              <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded">Ready</span>
            )}
          </div>

          {/* Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language="python"
              value={pythonCode}
              onChange={(value) => setPythonCode(value || '')}
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

        {/* Output Section */}
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
            <button
              onClick={clearOutput}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Output Content */}
          <div
            ref={outputRef}
            className="flex-1 bg-zinc-950 overflow-auto font-mono text-sm"
          >
            {output.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                <Terminal className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">Press <span className="text-zinc-400">Run</span> to execute Python</p>
                <p className="text-xs mt-1">or <span className="text-zinc-400">Sync to Students</span> to share</p>
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
                      className={`${
                        isError
                          ? 'text-red-400 bg-red-500/10 px-2 py-0.5 rounded'
                          : 'text-zinc-300'
                      }`}
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
