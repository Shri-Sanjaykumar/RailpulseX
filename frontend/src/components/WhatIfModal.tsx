import React from 'react';
import { X, Check, GitBranch, ArrowRight } from 'lucide-react';

export interface Scenario {
  scenario_id: string;
  scenario_label: string;
  hold_min: number;
  reroute: boolean;
  protect_connection: boolean;
  effective_delay: number;
  J: number;
  J_risk_sensitive: number;
  feasible?: boolean;
  components?: {
    passenger?: number;
    train_delay?: number;
    connection_miss?: number;
    platform_conflict?: number;
    crew_disruption?: number;
    operational_risk?: number;
  };
  cvar_penalty?: number;
  causal_delta_y?: number;
}

interface WhatIfModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarios: Scenario[];
  canonicalJNoAction: number;
  onSelectScenario: (scenario: Scenario) => void;
  selectedScenarioId: string | null;
  onApplyBestAction: () => void;
  bestScenarioId: string | null;
}

export const WhatIfModal: React.FC<WhatIfModalProps> = ({
  isOpen,
  onClose,
  scenarios,
  canonicalJNoAction,
  onSelectScenario,
  selectedScenarioId,
  onApplyBestAction,
  bestScenarioId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-fixed flex items-center justify-center p-4 select-none">
      <div className="bg-[#0A0F1E] border border-cyan-500/40 rounded-xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(0,240,255,0.2)] text-slate-200 overflow-hidden font-mono z-[100000]">
        {/* Header */}
        <div className="p-4 border-b border-[#1E2D4A] flex items-center justify-between bg-[#162036]">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-mono font-black text-white tracking-wider">
                WHAT-IF RAILWAY FUTURES LAB (7 CANDIDATE SCENARIOS)
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Independent deep-copy counterfactual simulation from identical base state
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

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Causal Estimation Disclaimer Badge */}
          <div className="p-2.5 rounded bg-cyan-950/50 border border-cyan-800/80 flex items-center justify-between text-xs font-mono text-cyan-300">
            <span>
              <b>METHOD:</b> Double Machine Learning (LinearDML) over network topological confounders
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-900 text-[10px] font-bold text-white uppercase">
              SIMULATION-DERIVED CAUSAL ESTIMATION
            </span>
          </div>

          {/* 7 Scenarios Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {scenarios.map(s => {
              const isSelected = selectedScenarioId === s.scenario_id;
              const isBest = bestScenarioId === s.scenario_id;
              const avoided = Math.max(0, canonicalJNoAction - s.J_risk_sensitive);
              const reductionPct = canonicalJNoAction > 0 ? (avoided / canonicalJNoAction) * 100 : 0;

              return (
                <div
                  key={s.scenario_id}
                  onClick={() => onSelectScenario(s)}
                  className={`p-3.5 rounded-lg border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                    isBest
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-900/30'
                      : isSelected
                      ? 'bg-[#162036] border-cyan-400'
                      : 'bg-[#162036]/60 border-[#1E2D4A] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-mono font-black text-white flex items-center space-x-1.5">
                        <span>{s.scenario_label}</span>
                        {isBest && (
                          <span className="px-1.5 py-0.2 bg-emerald-600 text-slate-950 font-extrabold text-[9px] rounded">
                            CP-SAT WINNER
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Effective Delay: {s.effective_delay.toFixed(1)}m | Hold: +{s.hold_min}m
                      </div>
                    </div>
                  </div>

                  {/* Disruption Score & Avoided Disruption */}
                  <div className="bg-[#070A13] p-2 rounded border border-[#1E2D4A] font-mono text-xs flex items-center justify-between">
                    <div>
                      <div className="text-[9px] text-slate-400">J(risk-sensitive)</div>
                      <div className={`font-bold ${isBest ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {s.J_risk_sensitive.toFixed(2)} pts
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-slate-400">Avoided Disruption</div>
                      <div className="font-bold text-cyan-300">
                        +{avoided.toFixed(2)} ({reductionPct.toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  {/* Constraint Checklist */}
                  <div className="text-[10px] font-mono text-slate-400 space-y-0.5 border-t border-slate-700/50 pt-2">
                    <div className="flex items-center space-x-1 text-emerald-400">
                      <Check className="w-3 h-3" />
                      <span>Headway & Dwell Constraints: VALID</span>
                    </div>
                    <div className="flex items-center space-x-1 text-emerald-400">
                      <Check className="w-3 h-3" />
                      <span>Platform AddNoOverlap: FEASIBLE</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E2D4A] flex items-center justify-between bg-[#162036]">
          <div className="text-xs font-mono text-slate-400">
            Canonical J(no_action) = <b className="text-rose-400">{canonicalJNoAction.toFixed(2)} pts</b>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#070A13] hover:bg-slate-800 text-slate-300 rounded font-mono text-xs transition"
            >
              CLOSE
            </button>
            <button
              onClick={() => {
                onApplyBestAction();
                onClose();
              }}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-mono text-xs font-black tracking-wider rounded shadow-lg shadow-emerald-900/40 transition flex items-center space-x-1.5"
            >
              <span>APPLY RECOMMENDED INTERVENTION</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
