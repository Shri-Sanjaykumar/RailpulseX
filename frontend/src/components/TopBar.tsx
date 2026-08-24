import React from 'react';
import { Play, Activity, Radio, Cpu, CloudRain, ShieldCheck, Layers } from 'lucide-react';

interface TopBarProps {
  clockTime: string;
  wsConnected: boolean;
  weatherCondition: string;
  onStartJuryDemo: () => void;
  isDemoRunning: boolean;
  viewMode: '3D' | '2D';
  onToggleViewMode: (mode: '3D' | '2D') => void;
  comparisonMode: boolean;
  onToggleComparisonMode: () => void;
  onOpenPSAlignment: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  clockTime,
  wsConnected,
  weatherCondition,
  onStartJuryDemo,
  isDemoRunning,
  viewMode,
  onToggleViewMode,
  comparisonMode,
  onToggleComparisonMode,
  onOpenPSAlignment,
}) => {
  return (
    <header className="h-14 bg-[#0E1424] border-b border-[#1E2D4A] px-4 flex items-center justify-between select-none z-30 font-mono">
      {/* Brand Wordmark & Hierarchy */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-sm tracking-wider text-white">RAILPULSE-X</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
              SIH PS 26028
            </span>
          </div>
          <p className="text-[9px] text-slate-400 tracking-wider uppercase">
            CLOSED-LOOP REAL-TIME ETA INTELLIGENCE
          </p>
        </div>
      </div>

      {/* Center Controls & Mode Switchers */}
      <div className="flex items-center space-x-2.5 text-xs">
        {/* View Mode 3D / 2D Switcher */}
        <div className="flex items-center bg-[#070A13] p-0.5 rounded border border-[#1E2D4A]">
          <button
            onClick={() => onToggleViewMode('3D')}
            className={`px-3 py-1 rounded transition ${
              viewMode === '3D'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3D GRAPH
          </button>
          <button
            onClick={() => onToggleViewMode('2D')}
            className={`px-3 py-1 rounded transition ${
              viewMode === '2D'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2D MAP
          </button>
        </div>

        {/* PS Alignment & Architecture Button */}
        <button
          onClick={onOpenPSAlignment}
          className="px-3 py-1.5 bg-[#162036] hover:bg-[#1f2d4d] text-cyan-300 border border-cyan-600/40 rounded font-semibold transition flex items-center space-x-1.5 shadow-sm"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>PS 26028 ALIGNMENT</span>
        </button>

        {/* Static vs RailPulse-X Comparison Mode Toggle */}
        <button
          onClick={onToggleComparisonMode}
          className={`px-3 py-1.5 rounded font-semibold transition flex items-center space-x-1.5 border ${
            comparisonMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20'
              : 'bg-[#162036] text-slate-300 border-slate-700 hover:bg-[#1f2d4d]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{comparisonMode ? 'MODE: STATIC VS DYNAMIC' : 'COMPARE VS STATIC'}</span>
        </button>

        {/* Telemetry Status Badges */}
        <div className="hidden xl:flex items-center space-x-2 text-[10px]">
          <span className="flex items-center space-x-1 px-2 py-1 rounded bg-[#070A13] border border-[#1E2D4A] text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>LIVE REPLAY</span>
          </span>

          <span className={`flex items-center space-x-1 px-2 py-1 rounded bg-[#070A13] border ${
            wsConnected ? 'text-cyan-400 border-cyan-900' : 'text-rose-400 border-rose-900'
          }`}>
            <Radio className="w-3 h-3" />
            <span>{wsConnected ? 'WS STREAM' : 'OFFLINE'}</span>
          </span>

          <span className="flex items-center space-x-1 px-2 py-1 rounded bg-[#070A13] border border-[#1E2D4A] text-slate-300">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>GATv2+CQR 90%</span>
          </span>

          <span className="flex items-center space-x-1 px-2 py-1 rounded bg-[#070A13] border border-[#1E2D4A] text-blue-300">
            <CloudRain className="w-3 h-3 text-blue-400" />
            <span>{weatherCondition}</span>
          </span>
        </div>
      </div>

      {/* Right Clock & 1-Click Jury Demo Action */}
      <div className="flex items-center space-x-3">
        <div className="text-right hidden sm:block">
          <div className="text-xs font-bold text-slate-200 tracking-wider">
            {clockTime}
          </div>
          <div className="text-[9px] text-slate-400">
            SIMULATION CLOCK
          </div>
        </div>

        <button
          onClick={onStartJuryDemo}
          disabled={isDemoRunning}
          className={`px-4 py-2 rounded text-xs font-extrabold tracking-wider transition flex items-center space-x-2 shadow-lg ${
            isDemoRunning
              ? 'bg-amber-600/50 text-amber-200 cursor-not-allowed animate-pulse border border-amber-500/50'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-cyan-500/30'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isDemoRunning ? 'DEMO RUNNING...' : 'START JURY DEMO'}</span>
        </button>
      </div>
    </header>
  );
};
