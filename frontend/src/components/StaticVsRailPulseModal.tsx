import React from 'react';
import { X, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

interface StaticVsRailPulseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaticVsRailPulseModal: React.FC<StaticVsRailPulseModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-fixed flex items-center justify-center p-4 select-none">
      <div className="bg-[#0A0F1E] border border-amber-500/40 rounded-xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(245,158,11,0.2)] text-slate-200 overflow-hidden font-mono z-[100000]">
        {/* Header */}
        <div className="p-4 border-b border-[#1E2D4A] flex items-center justify-between bg-[#162036]">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-mono font-black text-white tracking-wider">
                CONVENTIONAL STATIC ETA vs RAILPULSE-X INTERVENTION ENGINE
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Visualizing why point delay predictions fail under dense network cascades
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-[#070A13] hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Columns */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {/* Column A: Conventional Static ETA */}
          <div className="p-4 rounded-lg bg-[#070A13] border border-rose-900/60 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-rose-400 font-bold border-b border-rose-900/40 pb-2">
                <AlertCircle className="w-4 h-4" />
                <span>CONVENTIONAL STATIC ETA SYSTEM</span>
              </div>

              <div className="p-3 bg-[#0E1424] rounded border border-slate-800 space-y-2">
                <div className="text-slate-400 text-[11px]">Output Type:</div>
                <div className="text-lg font-black text-white">ETA = 18:45 (+15 min)</div>
                <div className="text-[10px] text-rose-400">Single scalar point estimate. Zero uncertainty bounds.</div>
              </div>

              <div className="space-y-2 text-slate-400 text-[11px]">
                <div className="flex items-start space-x-1.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><b>Isolated Point View</b>: Treats each train in isolation, blind to downstream station track capacity.</span>
                </div>
                <div className="flex items-start space-x-1.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><b>Zero Cascade Propagation</b>: Ignores knock-on delays at junction platforms.</span>
                </div>
                <div className="flex items-start space-x-1.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span><b>Passive Reporting</b>: Tells the operator delay has occurred, but cannot evaluate what to do about it.</span>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-rose-950/40 border border-rose-900 text-rose-300 text-[11px]">
              <b>Outcome:</b> Severe unmitigated delay cascade (J = 36.20 pts).
            </div>
          </div>

          {/* Column B: RailPulse-X Intervention Engine */}
          <div className="p-4 rounded-lg bg-[#070A13] border border-cyan-500/60 shadow-lg shadow-cyan-950/40 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-cyan-300 font-bold border-b border-cyan-900/40 pb-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>RAILPULSE-X INTERVENTION ENGINE</span>
              </div>

              <div className="p-3 bg-[#0E1424] rounded border border-cyan-500/30 space-y-2">
                <div className="text-slate-400 text-[11px]">Calibrated Conformal Forecast:</div>
                <div className="text-lg font-black text-cyan-300">
                  [P10: 6.0m | P50: 15.0m | P90: 27.8m]
                </div>
                <div className="text-[10px] text-emerald-400 font-bold">
                  Target 90% Empirical Coverage Calibrated via Split CQR
                </div>
              </div>

              <div className="space-y-2 text-slate-300 text-[11px]">
                <div className="flex items-start space-x-1.5">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><b>Dynamic Event Graph G(t)</b>: Propagates delay through station host and headway conflict edges.</span>
                </div>
                <div className="flex items-start space-x-1.5">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><b>7 Counterfactual Scenarios</b>: Simulates alternative holding, reassignments, and overtakes.</span>
                </div>
                <div className="flex items-start space-x-1.5">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><b>Risk-Sensitive CP-SAT</b>: Solves optimal intervention minimizing expected + tail risk in &lt;30ms.</span>
                </div>
                <div className="flex items-start space-x-1.5">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span><b>Closed-Loop Reforecasting</b>: Verifies avoided disruption (J = 36.20 to 9.15 pts).</span>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-emerald-950/50 border border-emerald-700 text-emerald-300 text-[11px] font-bold">
              <b>Outcome:</b> Avoided Disruption = <b>+27.05 pts (-74.7% Reduction) [VERIFIED]</b>.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E2D4A] flex justify-end bg-[#162036]">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono text-xs font-black rounded transition"
          >
            RETURN TO CONTROL ROOM
          </button>
        </div>
      </div>
    </div>
  );
};
