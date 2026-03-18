'use client';

import { useState, useEffect } from 'react';
import { generateRoomCode } from '@/lib/utils';
import TeacherView from '@/components/TeacherView';
import StudentView from '@/components/StudentView';

export default function Home() {
  const [view, setView] = useState<'home' | 'teacher' | 'student'>('home');
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');

  const createRoom = () => {
    const code = generateRoomCode();
    setRoomCode(code);
    setView('teacher');
  };

  const joinRoom = () => {
    if (inputCode.trim()) {
      setRoomCode(inputCode.toUpperCase());
      setView('student');
    }
  };

  const goHome = () => {
    setView('home');
    setRoomCode('');
    setInputCode('');
  };

  if (view === 'teacher') {
    return <TeacherView roomCode={roomCode} onGoHome={goHome} />;
  }

  if (view === 'student') {
    return <StudentView roomCode={roomCode} onGoHome={goHome} />;
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
            Code Classroom
          </h1>
          <p className="text-zinc-400 text-lg">
            Collaborative coding classroom for teachers and students
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Teacher Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5-1.253" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-zinc-100">I&apos;m a Teacher</h2>
            </div>
            <p className="text-zinc-400 mb-6">
              Create a classroom, write code, and share it with your students.
            </p>
            <button 
              onClick={createRoom}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Create New Room
            </button>
          </div>

          {/* Student Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-zinc-100">I&apos;m a Student</h2>
            </div>
            <p className="text-zinc-400 mb-6">
              Join a classroom using the room code from your teacher.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter room code (e.g., ABC123)"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="w-full bg-zinc-950 border border-zinc-800 text-white placeholder:text-zinc-600 px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500"
                maxLength={6}
              />
              <button 
                onClick={joinRoom}
                disabled={!inputCode.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800/50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
