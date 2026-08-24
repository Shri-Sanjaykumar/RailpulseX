import React from 'react';
import { X, Award, CheckCircle2 } from 'lucide-react';

interface ModelComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelComparisonModal: React.FC<ModelComparisonModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-fixed flex items-center justify-center p-4 select-none">
      <div className="bg-[#0A0F1E] border border-cyan-500/40 rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(0,240,255,0.2)] text-slate-200 overflow-hidden font-mono z-[100000]">
        {/* Header */}
        <div className="p-4 border-b border-[#1E2D4A] flex items-center justify-between bg-[#162036]">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-mono font-black text-white tracking-wider">
                EMPIRICAL MODEL BENCHMARK COMPARISON
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Evaluated on identical 215,088 held-out test events (Zero Leakage Chronological Split)
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

        {/* Table & Insights */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="border border-[#1E2D4A] rounded-lg overflow-hidden font-mono text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#162036] text-cyan-300 border-b border-[#1E2D4A]">
                <tr>
                  <th className="p-3">Evaluation Dimension</th>
                  <th className="p-3">Metric</th>
                  <th className="p-3">Baseline (LightGBM)</th>
                  <th className="p-3 bg-cyan-950/40 text-cyan-300">RailPulse-X Proposed</th>
                  <th className="p-3">Operational Significance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-[#070A13]">
                <tr>
                  <td className="p-3 font-bold text-slate-300">Point Accuracy</td>
                  <td className="p-3 text-slate-400">MAE (min)</td>
                  <td className="p-3">1.8456 min</td>
                  <td className="p-3 font-bold text-cyan-400 bg-cyan-950/20">1.8453 min</td>
                  <td className="p-3 text-slate-400">Point accuracy maintained</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-300">Tail Accuracy</td>
                  <td className="p-3 text-slate-400">RMSE (min)</td>
                  <td className="p-3">3.5802 min</td>
                  <td className="p-3 font-bold text-emerald-400 bg-cyan-950/20">3.5340 min</td>
                  <td className="p-3 text-emerald-300 font-semibold">+1.3% lower RMSE on tail delays</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-300">Probabilistic Loss</td>
                  <td className="p-3 text-slate-400">Pinball Loss</td>
                  <td className="p-3">0.5873</td>
                  <td className="p-3 font-bold text-cyan-400 bg-cyan-950/20">0.5873</td>
                  <td className="p-3 text-slate-400">Well-calibrated quantiles</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-300">Uncertainty Coverage</td>
                  <td className="p-3 text-slate-400">Conformal CQR</td>
                  <td className="p-3 text-amber-400">79.9% (Raw)</td>
                  <td className="p-3 font-bold text-emerald-400 bg-cyan-950/20">90.4% (Calibrated)</td>
                  <td className="p-3 text-emerald-300 font-semibold">Target 90% empirical coverage met</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-300">Interval Width</td>
                  <td className="p-3 text-slate-400">[P10, P90] Width</td>
                  <td className="p-3">7.33 min</td>
                  <td className="p-3 font-bold text-cyan-400 bg-cyan-950/20">7.33 min</td>
                  <td className="p-3 text-slate-400">Tight, informative bounds</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-300">Decision Speed</td>
                  <td className="p-3 text-slate-400">CP-SAT Latency</td>
                  <td className="p-3 text-slate-500">—</td>
                  <td className="p-3 font-bold text-emerald-400 bg-cyan-950/20">&lt; 30 ms</td>
                  <td className="p-3 text-slate-400">Real-time dispatcher responsiveness</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-300">Network Disruption</td>
                  <td className="p-3 text-slate-400">Disruption Reduction</td>
                  <td className="p-3 text-rose-400">36.20 pts (Passive)</td>
                  <td className="p-3 font-bold text-emerald-400 bg-cyan-950/20">9.15 pts (Optimized)</td>
                  <td className="p-3 text-emerald-300 font-bold">-74.7% Network Disruption Avoided</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded bg-[#162036] border border-[#1E2D4A] text-xs font-mono text-slate-300 space-y-1">
            <div className="font-bold text-cyan-400 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>KEY JURY TAKEAWAY</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Standard machine learning models stop at predicting point delays. RailPulse-X preserves high baseline accuracy while adding <b>calibrated conformal uncertainty</b>, <b>spatio-temporal cascade propagation</b>, <b>counterfactual intervention evaluation</b>, and <b>risk-sensitive optimization</b> to actively change the future of the network.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E2D4A] flex justify-end bg-[#162036]">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-black rounded transition"
          >
            CLOSE BENCHMARK REPORT
          </button>
        </div>
      </div>
    </div>
  );
};
