'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || '';

export default function Home() {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      path: '/api/socket',
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    setSocket(newSocket);

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    newSocket.on('connect', onConnect);
    newSocket.on('disconnect', onDisconnect);

    if (newSocket.connected) {
      setIsConnected(true);
    }

    return () => {
      newSocket.off('connect', onConnect);
      newSocket.off('disconnect', onDisconnect);
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    function onRoomCreated(code: string) {
      setIsCreating(false);
      router.push(`/room/${code}?role=teacher`);
    }

    function onRoomJoined(code: string) {
      setIsJoining(false);
      router.push(`/room/${code}?role=student`);
    }

    function onRoomError(message: string) {
      setIsJoining(false);
      setError(message);
    }

    socket.on('room:created', onRoomCreated);
    socket.on('room:joined', onRoomJoined);
    socket.on('room:error', onRoomError);

    return () => {
      socket.off('room:created', onRoomCreated);
      socket.off('room:joined', onRoomJoined);
      socket.off('room:error', onRoomError);
    };
  }, [socket, router]);

  const handleCreateRoom = () => {
    if (!socket) return;
    setIsCreating(true);
    socket.emit('room:create');
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !roomCode.trim()) return;
    
    setIsJoining(true);
    setError('');
    socket.emit('room:join', roomCode.toUpperCase());
  };

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
            Code Classroom
          </h1>
          <p className="text-zinc-400 text-lg">
            Real-time collaborative coding environment for teachers and students
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-500">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Teacher Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5-1.253" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-zinc-100">I&apos;m a Teacher</h2>
              </div>
              <p className="text-zinc-400">
                Create a new classroom and invite students with a room code
              </p>
            </div>
            <button 
              onClick={handleCreateRoom}
              disabled={isCreating || !isConnected}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isCreating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Room...
                </span>
              ) : (
                'Create New Room'
              )}
            </button>
          </div>

          {/* Student Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-zinc-100">I&apos;m a Student</h2>
              </div>
              <p className="text-zinc-400">
                Join an existing classroom using the room code from your teacher
              </p>
            </div>
            <form onSubmit={handleJoinRoom} className="space-y-3">
              <div>
                <label htmlFor="roomCode" className="block text-zinc-400 text-sm mb-1.5">
                  Room Code
                </label>
                <input
                  id="roomCode"
                  type="text"
                  placeholder="Enter room code (e.g., ABC123)"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white placeholder:text-zinc-600 px-3 py-2 rounded-lg focus:outline-none focus:border-zinc-600"
                  maxLength={6}
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              <button 
                type="submit"
                disabled={isJoining || !isConnected || !roomCode.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800/50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {isJoining ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Joining Room...
                  </span>
                ) : (
                  'Join Room'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
