'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { socket } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Users, Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (socket.connected) {
      setIsConnected(true);
    }

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  useEffect(() => {
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
  }, [router]);

  const handleCreateRoom = () => {
    setIsCreating(true);
    socket.emit('room:create');
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    
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
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-xl">I&apos;m a Teacher</CardTitle>
              </div>
              <CardDescription className="text-zinc-400">
                Create a new classroom and invite students with a room code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleCreateRoom}
                disabled={isCreating || !isConnected}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Room...
                  </>
                ) : (
                  'Create New Room'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Student Card */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <CardTitle className="text-xl">I&apos;m a Student</CardTitle>
              </div>
              <CardDescription className="text-zinc-400">
                Join an existing classroom using the room code from your teacher
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinRoom} className="space-y-3">
                <div>
                  <Label htmlFor="roomCode" className="text-zinc-400 text-sm mb-1.5 block">
                    Room Code
                  </Label>
                  <Input
                    id="roomCode"
                    placeholder="Enter room code (e.g., ABC123)"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600"
                    maxLength={6}
                  />
                </div>
                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}
                <Button 
                  type="submit"
                  disabled={isJoining || !isConnected || !roomCode.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining Room...
                    </>
                  ) : (
                    'Join Room'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
