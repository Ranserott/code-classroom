'use client';

import { useState } from 'react';
import { generateRoomCode } from '@/lib/utils';
import TeacherView from '@/components/TeacherView';
import StudentView from '@/components/StudentView';

export default function Home() {
  const [view, setView] = useState<'home' | 'teacher' | 'student'>('home');
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [mode, setMode] = useState<'web' | 'python'>('web');

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
    return <TeacherView roomCode={roomCode} onGoHome={goHome} mode={mode} />;
  }

  if (view === 'student') {
    return <StudentView roomCode={roomCode} onGoHome={goHome} mode={mode} />;
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
            Aula de Código
          </h1>
          <p className="text-zinc-400 text-lg">
            Aula colaborativa de programación para profesores y estudiantes
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
              <h2 className="text-xl font-semibold text-zinc-100">Soy Profesor</h2>
            </div>
            <p className="text-zinc-400 mb-6">
              Crea un aula, escribe código y compártelo con tus estudiantes.
            </p>
            <div className="space-y-3">
              <p className="text-zinc-400 text-sm text-center">¿Qué quieres enseñar?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setMode('web'); createRoom(); }}
                  className="flex flex-col items-center gap-1 py-3 px-3 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span className="text-xs font-medium">Web (HTML/CSS/JS)</span>
                </button>
                <button
                  onClick={() => { setMode('python'); createRoom(); }}
                  className="flex flex-col items-center gap-1 py-3 px-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6a2 2 0 100-4m0 4v2m0-10a2 2 0 110-4m0 4v2m0-10V4m0 2a2 2 0 100 4" />
                  </svg>
                  <span className="text-xs font-medium">Python</span>
                </button>
              </div>
            </div>
          </div>

          {/* Student Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-zinc-100">Soy Estudiante</h2>
            </div>
            <p className="text-zinc-400 mb-6">
              Únete a un aula usando el código proporcionado por tu profesor.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Ingresa el código (ej: ABC123)"
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
                Unirse al Aula
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
