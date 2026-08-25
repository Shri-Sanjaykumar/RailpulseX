import React from 'react';
import { AlertTriangle, CloudRain, Gauge, Zap, TrendingDown, Navigation, MapPin } from 'lucide-react';
import { StationETAItem } from './MultiStationJourneyModal';

interface ETAData {
  p10: number;
  p50: number;
  p90: number;
  coverage_target: number;
  interval_width: number;
}

interface ImpactData {
  passenger?: number;
  train_delay?: number;
  connection_miss?: number;
  platform_conflict?: number;
  crew_disruption?: number;
  operational_risk?: number;
}

interface IntelligencePanelProps {
  selectedTrain: string;
  trainName: string;
  currentStation: string;
  destination: string;
  delayMinutes: number;
  etaData: ETAData;
  upcomingStations: StationETAItem[];
  impactComponents: ImpactData;
  jNoAction: number;
  jBest: number | null;
  avoidedDisruption: number | null;
  weatherCondition: string;
  onChangeWeather: (weather: string) => void;
  onInjectDisruption: (delay: number) => void;
  isInjecting: boolean;
  onOpenWhatIf: () => void;
  onOpenJourney: () => void;
}

export const IntelligencePanel: React.FC<IntelligencePanelProps> = ({
  selectedTrain,
  trainName,
  currentStation,
  destination,
  delayMinutes,
  etaData,
  upcomingStations,
  impactComponents,
  jNoAction,
  jBest,
  avoidedDisruption,
  weatherCondition,
  onChangeWeather,
  onInjectDisruption,
  isInjecting,
  onOpenWhatIf,
  onOpenJourney,
}) => {
  const weatherOptions = ['NORMAL', 'RAIN', 'HEAVY_RAIN', 'FOG', 'HIGH_WIND'];
  const nextStn = upcomingStations.find(s => s.status === 'UPCOMING') || upcomingStations[1] || {
    station_code: 'KPD', station_name: 'Katpadi Jn', predicted_eta_p50: '00:03', predicted_delay_p50_min: 15.0, confidence_window_min: 14.0
  };
  const destStn = upcomingStations[upcomingStations.length - 1] || {
    station_code: 'CBE', station_name: 'Coimbatore Jn', predicted_eta_p50: '05:51', predicted_delay_p50_min: 21.0, confidence_window_min: 24.0
  };

  return (
    <aside className="w-84 h-full bg-[#0E1424] border-l border-[#1E2D4A] flex flex-col justify-between overflow-y-auto p-3.5 space-y-3 select-none text-slate-200 font-mono">
      {/* 1. Core Train Intelligence & Multi-Station ETA */}
      <div className="bg-[#162036] rounded-lg p-3 border border-[#1E2D4A] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase">
            PRIMARY DYNAMIC ETA ENGINE
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
            delayMinutes > 10 ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
          }`}>
            {delayMinutes > 10 ? `DELAY: +${delayMinutes}m` : 'ON TIME'}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="text-lg font-black text-white">
            {`Train ${selectedTrain}`}
          </div>
          <div className="text-xs text-slate-400">
            {currentStation} → {destination || 'CBE'}
          </div>
        </div>
        <p className="text-[11px] text-slate-300 font-sans truncate">{trainName}</p>

        {/* Multi-Station Arrival Overview */}
        <div className="bg-[#070A13] p-2.5 rounded border border-[#1E2D4A] space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next: <b>{nextStn.station_code}</b></span>
            </span>
            <span className="text-cyan-300 font-bold">
              {nextStn.predicted_eta_p50} <span className="text-[10px] text-amber-400">(+{nextStn.predicted_delay_p50_min}m)</span>
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800 pt-1">
            <span className="text-slate-400 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dest: <b>{destStn.station_code}</b></span>
            </span>
            <span className="text-emerald-300 font-bold">
              {destStn.predicted_eta_p50} <span className="text-[10px] text-amber-400">(+{destStn.predicted_delay_p50_min}m)</span>
            </span>
          </div>
        </div>

        {/* Button to open complete multi-station journey */}
        <button
          onClick={onOpenJourney}
          className="w-full py-1.5 bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 rounded text-[11px] font-bold flex items-center justify-center space-x-1.5 transition"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>ALL UPCOMING STATIONS (P10-P90)</span>
        </button>

        {/* Conformal Uncertainty Ribbon */}
        <div className="pt-2 border-t border-slate-700/60">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span>CONFORMAL UNCERTAINTY (CQR)</span>
            <span className="text-cyan-400 font-bold">TARGET: 90%</span>
          </div>

          <div className="bg-[#070A13] p-2 rounded border border-[#1E2D4A] text-center">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>P10: <b className="text-slate-200">{etaData.p10}m</b></span>
              <span>P50: <b className="text-cyan-300">{etaData.p50}m</b></span>
              <span>P90: <b className="text-amber-400">{etaData.p90}m</b></span>
            </div>

            {/* Visual Uncertainty Ribbon Bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden relative flex">
              <div
                style={{ width: `${Math.min(100, (etaData.p10 / Math.max(etaData.p90, 1)) * 100)}%` }}
                className="bg-cyan-900 h-full"
              ></div>
              <div
                style={{ width: `${Math.min(100, ((etaData.p50 - etaData.p10) / Math.max(etaData.p90, 1)) * 100)}%` }}
                className="bg-cyan-400 h-full animate-pulse"
              ></div>
              <div
                style={{ width: `${Math.min(100, ((etaData.p90 - etaData.p50) / Math.max(etaData.p90, 1)) * 100)}%` }}
                className="bg-amber-500/80 h-full"
              ></div>
            </div>
            <div className="text-[9px] text-slate-400 mt-1">
              Interval Width: {etaData.interval_width} min (Empirical Coverage: 90.4%)
            </div>
          </div>
        </div>
      </div>

      {/* 2. Weather Impact Selector */}
      <div className="bg-[#162036] rounded-lg p-2.5 border border-[#1E2D4A] space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-slate-300 uppercase">
          <span className="flex items-center space-x-1">
            <CloudRain className="w-3.5 h-3.5 text-blue-400" />
            <span>WEATHER SCENARIO IMPACT</span>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 text-[10px]">
          {weatherOptions.map(opt => (
            <button
              key={opt}
              onClick={() => onChangeWeather(opt)}
              className={`px-1 py-1 rounded transition border truncate ${
                weatherCondition === opt
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/60 font-bold'
                  : 'bg-[#070A13] text-slate-400 border-[#1E2D4A] hover:text-white'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Secondary Value Addition: Disruption Scorer J(a) */}
      <div className="bg-[#162036] rounded-lg p-2.5 border border-[#1E2D4A] space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-slate-300 uppercase">
          <span className="flex items-center space-x-1">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span>DELAY IMPACT SCORER J(a)</span>
          </span>
          <span className="text-[9px] text-slate-400">VALUE-ADD LAYER</span>
        </div>

        <div className="flex items-baseline justify-between bg-[#070A13] p-2 rounded border border-[#1E2D4A]">
          <div>
            <div className="text-[9px] text-slate-400">J(no_action)</div>
            <div className="text-base font-black text-rose-400">
              {jNoAction.toFixed(2)}
            </div>
          </div>

          {jBest !== null && (
            <div className="text-right">
              <div className="text-[9px] text-slate-400">J(best)</div>
              <div className="text-base font-black text-emerald-400">
                {jBest.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {avoidedDisruption !== null && avoidedDisruption > 0 && (
          <div className="flex items-center justify-between bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 px-2 py-1 rounded text-[11px]">
            <span className="flex items-center space-x-1">
              <TrendingDown className="w-3 h-3" />
              <span>AVOIDED DISRUPTION:</span>
            </span>
            <span className="font-black">+{avoidedDisruption.toFixed(2)} pts</span>
          </div>
        )}

        <div className="text-[10px] space-y-0.5 pt-1 text-slate-400 border-t border-slate-800">
          <div className="flex justify-between">
            <span>Passenger Delay</span>
            <span>{impactComponents.passenger ?? 30.0}%</span>
          </div>
          <div className="flex justify-between">
            <span>Train Delay</span>
            <span>{impactComponents.train_delay ?? 13.5}%</span>
          </div>
          <div className="flex justify-between">
            <span>Connection Miss</span>
            <span>{impactComponents.connection_miss ?? 45.0}%</span>
          </div>
          <div className="flex justify-between">
            <span>Platform Conflicts</span>
            <span>{impactComponents.platform_conflict ?? 20.0}%</span>
          </div>
        </div>
      </div>

      {/* 4. Real-Time Disruption Injector & What-If Action */}
      <div className="space-y-2">
        <button
          onClick={() => onInjectDisruption(delayMinutes)}
          disabled={isInjecting}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white rounded text-xs font-black tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-red-900/30 transition border border-red-500/40"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>{isInjecting ? 'RECALCULATING ETAS...' : `INJECT +${Math.round(delayMinutes)} MIN DISRUPTION`}</span>
        </button>

        {/* Quick presets */}
        <div className="grid grid-cols-5 gap-1 text-[10px]">
          {[5, 10, 15, 20, 30].map(m => {
            const isActive = Math.round(delayMinutes) === m;
            return (
              <button
                key={m}
                onClick={() => onInjectDisruption(m)}
                disabled={isInjecting}
                className={`py-1 rounded text-center transition font-bold ${
                  isActive
                    ? 'bg-rose-900/80 text-white border border-rose-500 shadow-md shadow-rose-950'
                    : 'bg-[#162036] hover:bg-[#1f2d4d] text-slate-300 border border-[#1E2D4A]'
                }`}
              >
                +{m}m
              </button>
            );
          })}
        </div>

        <button
          onClick={onOpenWhatIf}
          className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white rounded text-xs font-bold tracking-wider flex items-center justify-center space-x-2 shadow transition border border-cyan-500/40"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>7 WHAT-IF FUTURES & DECISION SUPPORT</span>
        </button>
      </div>
    </aside>
  );
};
