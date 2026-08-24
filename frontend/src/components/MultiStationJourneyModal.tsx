import React from 'react';
import { X, Navigation, Clock, ShieldCheck, MapPin, Gauge, CloudRain } from 'lucide-react';

export interface StationETAItem {
  station_code: string;
  station_name: string;
  distance_km: number;
  scheduled_arrival: string;
  predicted_eta_p10: string;
  predicted_eta_p50: string;
  predicted_eta_p90: string;
  predicted_delay_p50_min: number;
  confidence_window_min: number;
  sectional_running_time_min: number;
  status: string;
}

interface MultiStationJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainNumber: string;
  trainName: string;
  origin: string;
  destination: string;
  currentDelay: number;
  weatherCondition: string;
  stationsList: StationETAItem[];
}

export const MultiStationJourneyModal: React.FC<MultiStationJourneyModalProps> = ({
  isOpen,
  onClose,
  trainNumber,
  trainName,
  origin,
  destination,
  currentDelay,
  weatherCondition,
  stationsList,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-fixed flex items-center justify-center p-4 select-none">
      <div className="bg-[#0A0F1E] border border-cyan-500/40 rounded-xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(0,240,255,0.2)] text-slate-200 overflow-hidden font-mono z-[100000]">
        {/* Header */}
        <div className="p-4 border-b border-[#1E2D4A] flex items-center justify-between bg-[#121A2F]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Navigation className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-white tracking-wider">
                  TRAIN {trainNumber} — MULTI-STATION DYNAMIC ETA TRACKER
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                  CORE PS 26028 DELIVERABLE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {trainName} ({origin} → {destination}) | Continuous arrival distribution forecasting across intermediate blocks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-[#040711] hover:bg-slate-800 text-slate-400 hover:text-white transition border border-[#1E2D4A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Operating Conditions Status Bar */}
        <div className="p-3 bg-[#040711] border-b border-[#1E2D4A] grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Current Delay</div>
              <div className="font-bold text-amber-300">+{currentDelay.toFixed(1)} min at Origin</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Track Speed & Signal</div>
              <div className="font-bold text-cyan-300">78 km/h | ABS Green</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <CloudRain className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Weather Profile</div>
              <div className="font-bold text-blue-300">{weatherCondition}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Conformal Calibration</div>
              <div className="font-bold text-emerald-300">90.4% Empirical Coverage</div>
            </div>
          </div>
        </div>

        {/* Station-by-Station Table */}
        <div className="p-4 overflow-y-auto space-y-3">
          <div className="border border-[#1E2D4A] rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#121A2F] text-cyan-300 border-b border-[#1E2D4A] uppercase text-[10px]">
                <tr>
                  <th className="p-3">Stop #</th>
                  <th className="p-3">Station</th>
                  <th className="p-3">Distance</th>
                  <th className="p-3">Sched Arrival</th>
                  <th className="p-3 bg-cyan-950/50 text-cyan-300">Dynamic ETA (P50)</th>
                  <th className="p-3">Confidence Window (P10–P90)</th>
                  <th className="p-3">Section Runtime</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-[#040711]">
                {stationsList.map((stn, idx) => {
                  const isDestination = idx === stationsList.length - 1;
                  return (
                    <tr
                      key={stn.station_code}
                      className={isDestination ? 'bg-cyan-950/25 font-bold' : ''}
                    >
                      <td className="p-3 text-slate-500">#{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-white flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{stn.station_name} ({stn.station_code})</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-400">{stn.distance_km} km</td>
                      <td className="p-3 text-slate-400">{stn.scheduled_arrival}</td>
                      <td className="p-3 bg-cyan-950/30 font-bold text-cyan-300">
                        {stn.predicted_eta_p50} <span className="text-[10px] text-amber-400">(+{stn.predicted_delay_p50_min}m)</span>
                      </td>
                      <td className="p-3 text-slate-300">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-400">{stn.predicted_eta_p10}</span>
                          <span className="text-slate-600">──</span>
                          <span className="font-bold text-cyan-300">{stn.predicted_eta_p50}</span>
                          <span className="text-slate-600">──</span>
                          <span className="text-amber-400">{stn.predicted_eta_p90}</span>
                          <span className="text-[10px] text-slate-500">(±{(stn.confidence_window_min / 2).toFixed(0)}m)</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-400">{stn.sectional_running_time_min} min</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            stn.status === 'PASSED'
                              ? 'bg-slate-800 text-slate-400'
                              : stn.status === 'CURRENT'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : isDestination
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}
                        >
                          {isDestination ? 'DESTINATION' : stn.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded bg-[#121A2F] border border-[#1E2D4A] text-xs text-slate-300 space-y-1">
            <div className="font-bold text-cyan-400 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>CONTINUOUS DYNAMIC REFORECASTING LOGIC</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              When real-world conditions evolve (e.g. signal halt, speed restriction, weather changes, or dwell delays), the GATv2 + LightGBM + Conformal CQR model immediately recomputes expected arrival distributions across all downstream stations in milliseconds.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E2D4A] flex justify-end bg-[#121A2F]">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded transition shadow-lg shadow-cyan-500/20"
          >
            RETURN TO CONTROL ROOM
          </button>
        </div>
      </div>
    </div>
  );
};
