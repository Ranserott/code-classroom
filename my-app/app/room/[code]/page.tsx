'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { socket } from '@/lib/socket';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  Copy, 
  Check, 
  Users, 
  MonitorPlay,
  GraduationCap,
  Eye
} from 'lucide-react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-zinc-900">
      <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
    </div>
  ),
});

interface CodeState {
  html: string;
  css: string;
  js: string;
}

export default function RoomPage({ params }: { params: { code: string } }) {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') as 'teacher' | 'student' | null;
  
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('html');
  const [copied, setCopied] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  
  const [code, setCode] = useState<CodeState>({
    html: '',
    css: '',
    js: '',
  });

  // Debounced code update for teacher
  useEffect(() => {
    if (role !== 'teacher') return;
    
    const timeout = setTimeout(() => {
      socket.emit('code:update', {
        roomCode: params.code,
        html: code.html,
        css: code.css,
        js: code.js,
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [code, role, params.code]);

  useEffect(() => {
    if (!role) {
      setError('No role specified. Please go back and select teacher or student.');
      setIsConnecting(false);
      return;
    }

    // Ensure socket is connected
    if (!socket.connected) {
      socket.connect();
    }

    function onConnect() {
      if (role === 'teacher') {
        socket.emit('room:create');
      } else {
        socket.emit('room:join', params.code);
      }
    }

    function onRoomCreated(code: string) {
      if (code === params.code) {
        setIsConnecting(false);
      }
    }

    function onRoomJoined(code: string) {
      if (code === params.code) {
        setIsConnecting(false);
      }
    }

    function onRoomState(state: CodeState) {
      setCode(state);
    }

    function onCodeSync(newCode: CodeState) {
      if (role === 'student') {
        setCode(newCode);
      }
    }

    function onStudentJoined() {
      setStudentCount((prev) => prev + 1);
    }

    function onStudentLeft() {
      setStudentCount((prev) => Math.max(0, prev - 1));
    }

    function onRoomClosed(message: string) {
      setError(message);
      setIsConnecting(false);
    }

    function onRoomError(message: string) {
      setError(message);
      setIsConnecting(false);
    }

    function onDisconnect() {
      setError('Disconnected from server');
    }

    // Set up event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:created', onRoomCreated);
    socket.on('room:joined', onRoomJoined);
    socket.on('room:state', onRoomState);
    socket.on('code:sync', onCodeSync);
    socket.on('student:joined', onStudentJoined);
    socket.on('student:left', onStudentLeft);
    socket.on('room:closed', onRoomClosed);
    socket.on('room:error', onRoomError);

    // If already connected, trigger the appropriate action
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:created', onRoomCreated);
      socket.off('room:joined', onRoomJoined);
      socket.off('room:state', onRoomState);
      socket.off('code:sync', onCodeSync);
      socket.off('student:joined', onStudentJoined);
      socket.off('student:left', onStudentLeft);
      socket.off('room:closed', onRoomClosed);
      socket.off('room:error', onRoomError);
    };
  }, [role, params.code]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(params.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCodeChange = (value: string | undefined, language: 'html' | 'css' | 'js') => {
    if (role !== 'teacher') return;
    setCode((prev) => ({
      ...prev,
      [language]: value || '',
    }));
  };

  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>${code.css}</style>
      </head>
      <body>
        ${code.html}
        <script>${code.js}<\/script>
      </body>
    </html>
  `;

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-zinc-400">
            {role === 'teacher' ? 'Creating room...' : 'Joining room...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">Oops!</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <Button onClick={() => window.location.href = '/'}>
            Go Back Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-zinc-100">Code Classroom</h1>
            <Separator orientation="vertical" className="h-6 bg-zinc-700" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">Room:</span>
              <code className="px-2 py-0.5 bg-zinc-800 rounded text-sm font-mono text-zinc-200">
                {params.code}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCopyCode}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3 text-zinc-400" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {role === 'teacher' && (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Users className="w-4 h-4" />
                <span>{studentCount} student{studentCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            <Badge 
              variant={role === 'teacher' ? 'default' : 'secondary'}
              className={role === 'teacher' ? 'bg-blue-600' : 'bg-purple-600'}
            >
              {role === 'teacher' ? (
                <><GraduationCap className="w-3 h-3 mr-1" /> Teacher</>
              ) : (
                <><Eye className="w-3 h-3 mr-1" /> Student</>
              )}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Editor Section */}
        <div className="flex-1 flex flex-col min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b border-zinc-800 bg-zinc-900/50 p-0">
              <TabsTrigger 
                value="html" 
                className="rounded-none border-r border-zinc-800 px-6 py-2.5 data-[state=active]:bg-zinc-800"
              >
                HTML
              </TabsTrigger>
              <TabsTrigger 
                value="css" 
                className="rounded-none border-r border-zinc-800 px-6 py-2.5 data-[state=active]:bg-zinc-800"
              >
                CSS
              </TabsTrigger>
              <TabsTrigger 
                value="js" 
                className="rounded-none px-6 py-2.5 data-[state=active]:bg-zinc-800"
              >
                JavaScript
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 relative">
              <TabsContent value="html" className="absolute inset-0 m-0 mt-0">
                <MonacoEditor
                  language="html"
                  value={code.html}
                  onChange={(value) => handleCodeChange(value, 'html')}
                  options={{
                    readOnly: role !== 'teacher',
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    theme: 'vs-dark',
                  }}
                />
              </TabsContent>

              <TabsContent value="css" className="absolute inset-0 m-0 mt-0">
                <MonacoEditor
                  language="css"
                  value={code.css}
                  onChange={(value) => handleCodeChange(value, 'css')}
                  options={{
                    readOnly: role !== 'teacher',
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    theme: 'vs-dark',
                  }}
                />
              </TabsContent>

              <TabsContent value="js" className="absolute inset-0 m-0 mt-0">
                <MonacoEditor
                  language="javascript"
                  value={code.js}
                  onChange={(value) => handleCodeChange(value, 'js')}
                  options={{
                    readOnly: role !== 'teacher',
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    theme: 'vs-dark',
                  }}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Preview Section */}
        <div className="w-1/2 border-l border-zinc-800 flex flex-col min-w-0">
          <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MonitorPlay className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-300">Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Auto-refresh</span>
              <div className="w-2 h-2 rounded-full bg-green-500" />
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
      </main>
    </div>
  );
}
