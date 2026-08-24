import React from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, ChevronRight, Terminal } from 'lucide-react';

interface BottomTimelineProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  onReset: () => void;
  currentStage: number; // 0 to 6
  events: Array<{ time: string; message: string; type: 'info' | 'warn' | 'crit' | 'success' }>;
}

const STAGES = [
  'OBSERVE',
  'PREDICT',
  'PROPAGATE',
  'SIMULATE',
  'DECIDE',
  'REFORECAST',
  'VERIFY',
];

export const BottomTimeline: React.FC<BottomTimelineProps> = ({
  isPlaying,
  onTogglePlay,
  speed,
  onChangeSpeed,
  onReset,
  currentStage,
  events,
}) => {
  const speeds = [0.5, 1, 2, 5, 10];

  return (
    <footer className="h-16 bg-[#0E1424] border-t border-[#1E2D4A] px-4 flex items-center justify-between select-none text-xs font-mono z-20">
      {/* 1. Replay Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onTogglePlay}
          className="p-2 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition shadow"
          title={isPlaying ? 'Pause Replay' : 'Play Replay'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
        </button>

        <button
          onClick={onReset}
          className="p-2 rounded bg-[#162036] hover:bg-[#1f2d4d] text-slate-300 border border-[#1E2D4A] transition"
          title="Reset Simulation Clock"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Speed chips */}
        <div className="flex items-center bg-[#070A13] p-0.5 rounded border border-[#1E2D4A] space-x-0.5">
          {speeds.map(s => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              className={`px-1.5 py-0.5 text-[10px] rounded transition ${
                speed === s
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* 2. 7-Stage Closed-Loop Pipeline Tracker */}
      <div className="hidden md:flex items-center space-x-1">
        {STAGES.map((stage, idx) => {
          const isActive = currentStage === idx;
          const isDone = currentStage > idx;

          return (
            <React.Fragment key={stage}>
              <div
                className={`px-2 py-1 rounded text-[10px] tracking-wider font-extrabold flex items-center space-x-1 border transition ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/40 animate-pulse'
                    : isDone
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : 'bg-[#070A13] text-slate-500 border-[#1E2D4A]'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : null}
                <span>{stage}</span>
              </div>
              {idx < STAGES.length - 1 && (
                <ChevronRight className="w-3 h-3 text-slate-600" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 3. Live WebSocket Telemetry Log */}
      <div className="flex items-center space-x-2 bg-[#070A13] px-3 py-1.5 rounded border border-[#1E2D4A] max-w-sm w-full truncate">
        <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <div className="text-[11px] truncate text-slate-300 font-mono">
          {events.length > 0 ? (
            <span>
              <b className="text-slate-400">{events[events.length - 1].time}</b>: {events[events.length - 1].message}
            </span>
          ) : (
            <span className="text-slate-500">System listening for real-time telemetry events...</span>
          )}
        </div>
      </div>
    </footer>
  );
};
