import React from 'react';
import { X, CheckCircle2, ShieldCheck, Layers, Cpu, Server, Network } from 'lucide-react';

interface PSAlignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PSAlignmentModal: React.FC<PSAlignmentModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-fixed flex items-center justify-center p-4 select-none">
      <div className="bg-[#0A0F1E] border border-cyan-500/40 rounded-xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(0,240,255,0.2)] text-slate-200 overflow-hidden font-mono z-[100000]">
        {/* Header */}
        <div className="p-4 border-b border-[#1E2D4A] flex items-center justify-between bg-[#162036]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded bg-cyan-600/30 text-cyan-300 border border-cyan-500/50">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-wider">
                CLOSED-LOOP REAL-TIME ETA INTELLIGENCE (SIH PS 26028)
              </h2>
              <p className="text-xs text-slate-400">
                Dynamic ETA Prediction, Delay Propagation & Decision Support for Indian Railways
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

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs">
          {/* Core Philosophy Banner */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/40 space-y-2">
            <div className="text-xs font-black text-cyan-300 uppercase tracking-widest">
              Core Project Philosophy & Jury Narrative
            </div>
            <p className="text-base font-bold text-white italic">
              "Predict the arrival. Understand the impact. Improve the decision."
            </p>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Our core requirement is <b>dynamic, real-time ETA prediction for coaching trains</b>. Rather than relying on rigid static schedules and simple delay carry-forwards, RailPulse-X predicts arrival distributions across upcoming intermediate stations and destination. When real-world events occur, the system continuously reforecasts ETAs and evaluates downstream delay impacts to provide operational decision support.
            </p>
          </div>

          {/* 7-Step Presentation Narrative Workflow */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Network className="w-4 h-4" />
              <span>7-Step Real-Time Architecture Flow</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-2 text-center text-[10px]">
              <div className="p-2.5 rounded bg-[#162036] border border-[#1E2D4A]">
                <div className="font-bold text-cyan-300">1. REAL DATA</div>
                <div className="text-slate-400 mt-1">GPS, Speeds, Signals, Weather, Section Times</div>
              </div>
              <div className="p-2.5 rounded bg-[#162036] border border-[#1E2D4A]">
                <div className="font-bold text-cyan-300">2. VALIDATE</div>
                <div className="text-slate-400 mt-1">Cleaning, Outlier Detection, Fallback Check</div>
              </div>
              <div className="p-2.5 rounded bg-[#162036] border border-cyan-500/60 shadow-sm shadow-cyan-500/20">
                <div className="font-bold text-cyan-300">3. PREDICT ETA</div>
                <div className="text-slate-400 mt-1">LightGBM + GATv2 Quantile Forecaster</div>
              </div>
              <div className="p-2.5 rounded bg-[#162036] border border-cyan-500/60 shadow-sm shadow-cyan-500/20">
                <div className="font-bold text-cyan-300">4. MULTI-STATION</div>
                <div className="text-slate-400 mt-1">Next, Intermediate & Destination P10/P50/P90</div>
              </div>
              <div className="p-2.5 rounded bg-[#162036] border border-[#1E2D4A]">
                <div className="font-bold text-amber-300">5. REFORECAST</div>
                <div className="text-slate-400 mt-1">Continuous updates on signal halts & recoveries</div>
              </div>
              <div className="p-2.5 rounded bg-[#162036] border border-[#1E2D4A]">
                <div className="font-bold text-amber-300">6. DECISIONS</div>
                <div className="text-slate-400 mt-1">7 What-If Futures & Risk-Sensitive CP-SAT</div>
              </div>
              <div className="p-2.5 rounded bg-[#162036] border border-emerald-500/60">
                <div className="font-bold text-emerald-300">7. DELIVER</div>
                <div className="text-slate-400 mt-1">Passenger App, Station Display & OCC Dashboard</div>
              </div>
            </div>
          </div>

          {/* Detailed Problem Statement Mapping Table */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>PS 26028 Line-by-Line Requirement Solution Matrix</span>
            </div>

            <div className="border border-[#1E2D4A] rounded-lg overflow-hidden text-[11px]">
              <table className="w-full text-left">
                <thead className="bg-[#162036] text-cyan-300 border-b border-[#1E2D4A]">
                  <tr>
                    <th className="p-2.5">PS 26028 Requirement</th>
                    <th className="p-2.5">RailPulse-X Technical Solution</th>
                    <th className="p-2.5">Operational Output</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-[#070A13]">
                  <tr>
                    <td className="p-2.5 font-bold text-slate-300">Static ETA Inaccuracy</td>
                    <td className="p-2.5 text-cyan-400 font-semibold">LightGBM + GATv2 Machine Learning</td>
                    <td className="p-2.5 text-slate-400">Dynamic delay accounting for sectional running time</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-300">Real-Time Operational Ground Realities</td>
                    <td className="p-2.5 text-cyan-400 font-semibold">Sectional speeds, congestion proxies, weather profiles</td>
                    <td className="p-2.5 text-slate-400">Dynamic speed restriction & weather multipliers</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-300">Arrivals at Upcoming Stations</td>
                    <td className="p-2.5 text-cyan-400 font-semibold">Multi-Station Dynamic Journey Engine</td>
                    <td className="p-2.5 text-slate-400">Station-by-station intermediate & destination ETAs</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-300">Uncertainty & Planning Difficulties</td>
                    <td className="p-2.5 text-cyan-400 font-semibold">Conformalized Quantile Regression (Split CQR)</td>
                    <td className="p-2.5 text-slate-400">Calibrated P10 / P50 / P90 confidence window (90.4% coverage)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-300">Continuous Updating</td>
                    <td className="p-2.5 text-cyan-400 font-semibold">Closed-Loop Reforecasting Loop</td>
                    <td className="p-2.5 text-slate-400">Instant re-prediction when delays or recoveries occur</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-300">Scalability for Thousands of Trains</td>
                    <td className="p-2.5 text-cyan-400 font-semibold">Distributed async inference + Redis shared state</td>
                    <td className="p-2.5 text-slate-400">Concurrent batch processing across train streams</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-300">Diverse Railway Zones</td>
                    <td className="p-2.5 text-cyan-400 font-semibold">Zone-aware feature encoders (SR, NR, CR, ER, SWR, SCR)</td>
                    <td className="p-2.5 text-slate-400">Adapts to local terrain and headway characteristics</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-300">Multi-Channel APIs</td>
                    <td className="p-2.5 text-cyan-400 font-semibold">FastAPI REST + WebSocket /stream</td>
                    <td className="p-2.5 text-slate-400">Passenger Mobile App, Station Displays, OCC Dashboard</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-slate-300">Decision Support (Value Addition)</td>
                    <td className="p-2.5 text-amber-400 font-semibold">7 What-If Futures + Risk-Sensitive CP-SAT Optimizer</td>
                    <td className="p-2.5 text-slate-400">-74.7% Network Disruption Reduction (+27.05 pts avoided)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Scalability, Zone Adaptation, & Data Transparency Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded bg-[#162036] border border-[#1E2D4A] space-y-1.5">
              <div className="font-bold text-cyan-300 flex items-center space-x-1">
                <Server className="w-3.5 h-3.5" />
                <span>Thousands-of-Trains Scalability</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Inference workers are decoupled from the API gateway. Each train is an independent event stream, allowing horizontal scaling across multiple worker nodes backed by Redis caching.
              </p>
            </div>

            <div className="p-3 rounded bg-[#162036] border border-[#1E2D4A] space-y-1.5">
              <div className="font-bold text-cyan-300 flex items-center space-x-1">
                <Cpu className="w-3.5 h-3.5" />
                <span>Zone & Route Adaptation</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                The architecture uses zone-specific running time profiles and station topology embeddings while maintaining a unified, robust GATv2 + LightGBM pipeline.
              </p>
            </div>

            <div className="p-3 rounded bg-[#162036] border border-[#1E2D4A] space-y-1.5">
              <div className="font-bold text-emerald-300 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Data Integrity & Fallback</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Prototype runs on statistically constrained synthetic proxy (1.075M events). If live GPS is interrupted, the system gracefully falls back to validated last state + historical sectional estimates.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E2D4A] flex justify-end bg-[#162036]">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded transition"
          >
            RETURN TO OPERATIONAL DASHBOARD
          </button>
        </div>
      </div>
    </div>
  );
};
