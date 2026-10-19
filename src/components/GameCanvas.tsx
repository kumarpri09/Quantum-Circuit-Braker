import React, { useEffect, useRef, useState } from 'react';
import { QuantumEngine, CAMPAIGN_LEVELS, LevelConfig, CircuitNode } from '../game/quantumEngine';
import { sound } from '../utils/audio';
import { Play, RotateCw, RefreshCw, Volume2, VolumeX, Sparkles, Package, Trophy, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

interface GameCanvasProps {
  onOpenItchHub: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ onOpenItchHub }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [engine, setEngine] = useState<QuantumEngine>(() => new QuantumEngine(CAMPAIGN_LEVELS[0]));
  const [timeLeft, setTimeLeft] = useState(CAMPAIGN_LEVELS[0].timeLimit);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'overload'>('playing');
  const [muted, setMuted] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [score, setScore] = useState(0);

  // Timer countdown
  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('overload');
          sound.playOverload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentLevelIdx, gameState]);

  // Initial simulation
  useEffect(() => {
    engine.simulate();
  }, [engine]);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gridSize = engine.gridSize;
      const cellSize = canvas.width / gridSize;

      // Draw background grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();
      }

      // Draw active laser beams
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#06b6d4';
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 4;

      for (const beam of engine.activeBeams) {
        const bx = beam.x * cellSize + cellSize / 2;
        const by = beam.y * cellSize + cellSize / 2;
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(bx, by, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Draw nodes
      engine.nodes.forEach((node, key) => {
        const nx = node.x * cellSize + cellSize / 2;
        const ny = node.y * cellSize + cellSize / 2;

        ctx.save();
        ctx.translate(nx, ny);
        ctx.rotate((node.rotation * Math.PI) / 2);

        // Outer badge/glow if energized
        if (node.energized) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#10b981';
        }

        // Draw node background box
        ctx.fillStyle = node.energized ? '#065f46' : '#0f172a';
        ctx.strokeStyle = node.energized ? '#34d399' : '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-cellSize * 0.38, -cellSize * 0.38, cellSize * 0.76, cellSize * 0.76, 8);
        ctx.fill();
        ctx.stroke();

        // Draw node icons based on type
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (node.type === 'emitter') {
          ctx.fillStyle = '#22d3ee';
          ctx.fillText('⚡', 0, 0);
        } else if (node.type === 'receiver') {
          ctx.fillStyle = node.energized ? '#34d399' : '#64748b';
          ctx.fillText('🎯', 0, 0);
        } else if (node.type === 'mirror') {
          ctx.fillStyle = '#c084fc';
          ctx.fillText('🪞', 0, 0);
        } else if (node.type === 'splitter') {
          ctx.fillStyle = '#f43f5e';
          ctx.fillText('🔀', 0, 0);
        } else if (node.type === 'phase') {
          ctx.fillStyle = '#fbbf24';
          ctx.fillText('🔮', 0, 0);
        } else if (node.type === 'barrier') {
          ctx.fillStyle = '#64748b';
          ctx.fillText('🧱', 0, 0);
        }

        ctx.restore();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [engine]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const gridSize = engine.gridSize;
    const cellSize = canvas.width / gridSize;
    const gridX = Math.floor(x / cellSize);
    const gridY = Math.floor(y / cellSize);

    const rotated = engine.rotateNode(gridX, gridY);
    if (rotated) {
      sound.playRotate();
      sound.playBeamPulse();
      // Force state update
      setEngine(Object.assign(new QuantumEngine({ id: 0, levelName: '', briefing: '', gridSize: engine.gridSize, timeLimit: 0, targetResonance: 0, nodes: [] }), engine));

      if (engine.isWon()) {
        setGameState('won');
        sound.playSuccess();
        setScore((prev) => prev + 500 + timeLeft * 10);
      }
    }
  };

  const loadLevel = (idx: number) => {
    setCurrentLevelIdx(idx);
    const lvl = CAMPAIGN_LEVELS[idx];
    const newEng = new QuantumEngine(lvl);
    setEngine(newEng);
    setTimeLeft(lvl.timeLimit);
    setGameState('playing');
  };

  const restartLevel = () => {
    loadLevel(currentLevelIdx);
  };

  const handleGenerateAILevel = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/generate-puzzle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty: 'medium', theme: 'Quantum Surge' })
      });
      const data = await res.json();
      if (data.success && data.puzzle) {
        const aiLevel: LevelConfig = {
          id: 999,
          levelName: data.puzzle.levelName || 'AI Quantum Matrix',
          briefing: data.puzzle.briefing || 'Custom neural circuit generated by Gemini AI.',
          gridSize: data.puzzle.gridSize || 6,
          timeLimit: data.puzzle.timeLimit || 90,
          targetResonance: 100,
          nodes: data.puzzle.nodes || []
        };
        const newEng = new QuantumEngine(aiLevel);
        setEngine(newEng);
        setTimeLeft(aiLevel.timeLimit);
        setGameState('playing');
      } else {
        alert('Failed to generate AI puzzle.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to AI puzzle server.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const toggleAudio = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    sound.setMuted(newMuted);
  };

  const currentLevel = CAMPAIGN_LEVELS[currentLevelIdx] || CAMPAIGN_LEVELS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Contract (3 zones) */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
            ⚡
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            Quantum Circuit Breaker
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <span className="text-cyan-400 font-semibold">{currentLevel.levelName}</span>
          <span aria-hidden="true">·</span>
          <span>Score: <strong className="text-emerald-400 tabular-nums">{score}</strong></span>
          <span aria-hidden="true">·</span>
          <span>Time: <strong className={`tabular-nums ${timeLeft < 15 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>{timeLeft}s</strong></span>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggleAudio}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={muted ? "Unmute Audio" : "Mute Audio"}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
          <button
            onClick={onOpenItchHub}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md shadow-cyan-500/20 flex items-center gap-2 whitespace-nowrap"
          >
            <Package className="w-4 h-4" />
            Itch.io Exporter Hub
          </button>
        </div>
      </header>

      {/* Main Game Arena */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 gap-8 max-w-7xl mx-auto w-full">
        {/* Left / Sidebar Info */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold tracking-wider text-cyan-400 uppercase">Circuit Briefing</h2>
            <p className="text-sm text-slate-300 leading-relaxed">{currentLevel.briefing}</p>
            <div className="pt-2 border-t border-slate-800 flex justify-between text-xs text-slate-400">
              <span>Grid: {engine.gridSize}x{engine.gridSize}</span>
              <span>Target: 100% Core Alignment</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold tracking-wider text-emerald-400 uppercase">Level Select</h2>
            <div className="grid grid-cols-5 gap-2">
              {CAMPAIGN_LEVELS.map((lvl, idx) => (
                <button
                  key={lvl.id}
                  onClick={() => loadLevel(idx)}
                  className={`py-2 text-xs font-bold rounded-lg transition-colors ${
                    currentLevelIdx === idx
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <button
              onClick={handleGenerateAILevel}
              disabled={isGeneratingAI}
              className="w-full mt-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 font-medium text-xs rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Cpu className="w-4 h-4" />
              {isGeneratingAI ? 'Generating AI Quantum Puzzle...' : 'AI Generated Puzzle (Gemini)'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={restartLevel}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Circuit
            </button>
          </div>
        </div>

        {/* Center Canvas Stage */}
        <div className="relative flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <canvas
            ref={canvasRef}
            width={440}
            height={440}
            onClick={handleCanvasClick}
            className="cursor-pointer bg-slate-950 rounded-xl border border-slate-800 shadow-inner"
          />
          <p className="text-xs text-slate-400 mt-4 text-center">
            Click on mirrors, splitters, or phase shifters to rotate them 90° and route the quantum beam to the target core.
          </p>

          {/* Win / Overload Overlay */}
          {gameState === 'won' && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-2xl font-bold">
                ✓
              </div>
              <h3 className="text-2xl font-bold text-white">Quantum Resonance Achieved!</h3>
              <p className="text-sm text-slate-300 max-w-xs">Circuit successfully energized within safe temporal parameters.</p>
              <button
                onClick={() => {
                  if (currentLevelIdx < CAMPAIGN_LEVELS.length - 1) {
                    loadLevel(currentLevelIdx + 1);
                  } else {
                    onOpenItchHub();
                  }
                }}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                {currentLevelIdx < CAMPAIGN_LEVELS.length - 1 ? 'Next Circuit' : 'Proceed to Itch.io Hub'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {gameState === 'overload' && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 text-2xl font-bold">
                ✕
              </div>
              <h3 className="text-2xl font-bold text-white">Temporal Overload!</h3>
              <p className="text-sm text-slate-300 max-w-xs">The quantum flux destabilized before core alignment.</p>
              <button
                onClick={restartLevel}
                className="px-6 py-3 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Circuit
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
