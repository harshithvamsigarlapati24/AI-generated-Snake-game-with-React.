/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2,
  ListMusic,
  Monitor,
  AlertCircle
} from 'lucide-react';

// --- Types ---
interface Track {
  id: string;
  name: string;
  artist: string;
  stream: string;
  duration: string;
}

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const AUDIO_TRACKS: Track[] = [
  {
    id: "TRK_01",
    name: "Neon Circuit",
    artist: "AI Weaver v.1",
    stream: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: "3:42"
  },
  {
    id: "TRK_02",
    name: "Digital Pulse",
    artist: "Neural Beatmaker",
    stream: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: "2:15"
  },
  {
    id: "TRK_03",
    name: "Ether Drift",
    artist: "Synth Mind",
    stream: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: "4:58"
  }
];

// --- Snake Game Component ---
const SnakeViewport = ({ score, peakScore, setScore, setPeakScore }: { score: number, peakScore: number, setScore: React.Dispatch<React.SetStateAction<number>>, setPeakScore: React.Dispatch<React.SetStateAction<number>> }) => {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [dir, setDir] = useState<Direction>('UP');
  const [isDead, setIsDead] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const spawnFood = useCallback((currentSnake: Point[]) => {
    let next: Point;
    while (true) {
      next = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!currentSnake.some(p => p.x === next.x && p.y === next.y)) break;
    }
    return next;
  }, []);

  const tick = useCallback(() => {
    if (isPaused || isDead) return;

    setSnake(prev => {
      const head = prev[0];
      const next = { ...head };

      switch (dir) {
        case 'UP': next.y -= 1; break;
        case 'DOWN': next.y += 1; break;
        case 'LEFT': next.x -= 1; break;
        case 'RIGHT': next.x += 1; break;
      }

      if (next.x < 0 || next.x >= GRID_SIZE || next.y < 0 || next.y >= GRID_SIZE || 
          prev.some(p => p.x === next.x && p.y === next.y)) {
        setIsDead(true);
        return prev;
      }

      const nextSnake = [next, ...prev];
      if (next.x === food.x && next.y === food.y) {
        setScore(s => s + 20);
        setFood(spawnFood(nextSnake));
      } else {
        nextSnake.pop();
      }
      return nextSnake;
    });
  }, [dir, food, isPaused, isDead, spawnFood, setScore]);

  useEffect(() => {
    timerRef.current = setInterval(tick, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [tick]);

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (dir !== 'DOWN') setDir('UP'); break;
        case 'ArrowDown': if (dir !== 'UP') setDir('DOWN'); break;
        case 'ArrowLeft': if (dir !== 'RIGHT') setDir('LEFT'); break;
        case 'ArrowRight': if (dir !== 'LEFT') setDir('RIGHT'); break;
        case ' ': setIsPaused(p => !p); break;
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [dir]);

  useEffect(() => {
    if (score > peakScore) setPeakScore(score);
  }, [score, peakScore, setPeakScore]);

  const reset = () => {
    setSnake(INITIAL_SNAKE);
    setFood(spawnFood(INITIAL_SNAKE));
    setDir('UP');
    setIsDead(false);
    setScore(0);
    setIsPaused(false);
  };

  return (
    <div className="relative w-[440px] h-[440px] bg-[#080810] border-2 border-[#1a1a2e] shadow-2xl overflow-hidden group">
      <div 
        className="grid w-full h-full p-px"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);
          const isHead = snake[0].x === x && snake[0].y === y;
          const isBody = snake.slice(1).some(p => p.x === x && p.y === y);
          const isFood = food.x === x && food.y === y;

          return (
            <div 
              key={i} 
              className={`w-full h-full border border-white/5 ${
                isHead ? 'bg-white shadow-[0_0_15px_#00f3ff] z-10 rounded-sm' :
                isBody ? 'bg-neon-cyan shadow-[0_0_10px_#00f3ff] opacity-80 rounded-sm' :
                isFood ? 'bg-neon-magenta rounded-full animate-pulse-neon' :
                ''
              }`}
            />
          );
        })}
      </div>

      <AnimatePresence>
        {(isDead || isPaused) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-20"
          >
            {isDead ? (
              <>
                <h2 className="text-3xl font-black text-neon-magenta mb-2 uppercase tracking-tight italic">Fatal Error</h2>
                <button 
                  onClick={reset}
                  className="px-6 py-2 border-2 border-neon-cyan text-neon-cyan font-bold uppercase hover:bg-neon-cyan/10 transition-colors"
                >
                  System Reboot
                </button>
              </>
            ) : (
              <>
                <Monitor className="w-12 h-12 text-neon-cyan/40 mb-4" />
                <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-[0.4em]">Standby</h2>
                <button 
                  onClick={() => setIsPaused(false)}
                  className="px-8 py-3 bg-neon-cyan text-black font-black uppercase hover:bg-white transition-colors"
                >
                  Init Link
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- App Layout ---
export default function App() {
  const [score, setScore] = useState(0);
  const [peakScore, setPeakScore] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const track = AUDIO_TRACKS[currentTrack];

  return (
    <div className="w-full h-screen flex flex-col bg-dark-bg text-white font-sans border border-[#1a1a2e] overflow-hidden">
      {/* Header */}
      <header className="h-20 px-10 flex justify-between items-center bg-gradient-to-b from-neon-cyan/5 to-transparent border-b border-white/5">
        <div className="text-2xl font-black tracking-[0.2em] text-neon-cyan neon-glow-cyan">SYNTH.GRID</div>
        <div className="flex gap-8 font-mono">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase opacity-50 tracking-widest">Current</span>
            <span className="text-2xl text-neon-magenta neon-glow-magenta">{score.toString().padStart(4, '0')}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase opacity-50 tracking-widest">Highest</span>
            <span className="text-2xl text-neon-magenta neon-glow-magenta opacity-60">{peakScore.toString().padStart(4, '0')}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 grid grid-cols-[300px_1fr_300px] gap-5 p-[30px] items-center">
        {/* Left Panel: Playlist */}
        <aside className="panel-glass p-5 h-full">
          <div className="text-[12px] uppercase tracking-[0.2em] mb-5 text-neon-cyan flex items-center gap-2">
            <ListMusic className="w-4 h-4" /> Audio Stream
          </div>
          <div className="space-y-2.5">
            {AUDIO_TRACKS.map((t, i) => (
              <div 
                key={t.id} 
                className={`p-3 rounded-lg flex justify-between items-center bg-white/[0.01] border-l-2 transition-all cursor-pointer ${i === currentTrack ? 'bg-neon-cyan/10 border-neon-cyan' : 'border-transparent hover:bg-white/[0.03]'}`}
                onClick={() => setCurrentTrack(i)}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{t.name}</span>
                  <span className="text-[11px] opacity-60">{t.artist}</span>
                </div>
                <span className="text-[11px] opacity-40 font-mono">{t.duration}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Center: Game */}
        <div className="flex justify-center items-center">
          <SnakeViewport score={score} peakScore={peakScore} setScore={setScore} setPeakScore={setPeakScore} />
        </div>

        {/* Right Panel: Monitor */}
        <aside className="panel-glass p-5 h-full flex flex-col">
          <div className="text-[12px] uppercase tracking-[0.2em] mb-5 text-neon-cyan flex items-center gap-2">
            <ActivityIcon className="w-4 h-4" /> System Monitor
          </div>
          
          <div className="flex items-end gap-1 height-[120px] mt-auto">
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.div 
                key={i}
                initial={{ height: "10%" }}
                animate={{ height: isPlaying ? `${20 + Math.random() * 80}%` : `${10 + (i * 5)}%` }}
                className="flex-1 bg-gradient-to-t from-neon-cyan to-neon-magenta rounded-t-sm opacity-70"
              />
            ))}
          </div>

          <div className="mt-5 text-[11px] opacity-50 font-mono leading-relaxed uppercase">
            Latency: 12ms<br />
            Buffer: Stable<br />
            Render: 60FPS
          </div>
        </aside>
      </main>

      {/* Footer / Controls */}
      <footer className="h-[100px] bg-[#0a0a0f] border-t border-white/5 flex items-center px-10 justify-between">
        <div className="flex items-center gap-4 w-[250px]">
          <div className="w-[50px] h-[50px] bg-gradient-to-br from-[#1a1a2e] to-neon-cyan rounded flex items-center justify-center text-neon-cyan">
             <RadioIcon className="w-6 h-6" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate uppercase tracking-wider">{track.name}</span>
            <span className="text-[11px] opacity-60 truncate">{track.artist}</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <SkipBack className="w-5 h-5 cursor-pointer opacity-80 hover:opacity-100 hover:scale-110 transition-all text-white" />
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-[50px] h-[50px] rounded-full bg-white flex items-center justify-center transition-all hover:scale-110 shadow-lg"
          >
            {isPlaying ? <Pause className="w-5 h-5 text-black fill-current" /> : <Play className="w-5 h-5 text-black fill-current translate-x-0.5" />}
          </button>
          <SkipForward className="w-5 h-5 cursor-pointer opacity-80 hover:opacity-100 hover:scale-110 transition-all text-white" />
        </div>

        <div className="flex-1 mx-10 flex flex-col gap-2">
          <div className="h-1 w-full bg-[#222] rounded-full relative overflow-hidden">
            <motion.div 
              className="absolute h-full bg-neon-cyan shadow-[0_0_10px_#00f3ff]" 
              animate={{ width: isPlaying ? '65%' : `${progress}%` }} 
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono opacity-50 uppercase">
            <span>01:14</span>
            <span>{track.duration}</span>
          </div>
        </div>

        <div className="w-[100px] flex justify-end">
          <Volume2 className="w-5 h-5 cursor-pointer opacity-60 hover:opacity-100 transition-opacity" />
        </div>
      </footer>

      {/* Logic components for music */}
      <audio ref={audioRef} src={track.stream} loop={false} />
    </div>
  );
}

const ActivityIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);

const RadioIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/>
  </svg>
);
