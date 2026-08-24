import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Radio, MapPin } from 'lucide-react';

interface Station {
  station_code: string;
  lat: number;
  lon: number;
  zone: string;
  delay_index: number;
}

interface Train {
  train_number: string;
  train_name: string;
  current_station: string;
  delay_minutes: number;
  status: string;
  priority: number;
}

interface OperationalMap2DProps {
  stations: Station[];
  trains: Train[];
  selectedTrain: string;
  onSelectTrain: (trainNo: string) => void;
  disruptedTrain: string | null;
  disruptedStation: string | null;
  affectedStations: string[];
}

export const OperationalMap2D: React.FC<OperationalMap2DProps> = ({
  stations,
  trains,
  selectedTrain,
  onSelectTrain,
  disruptedTrain,
  disruptedStation,
  affectedStations,
}) => {
  const stationLookup = new Map(stations.map(s => [s.station_code, s]));
  const [pulseRadius, setPulseRadius] = useState(30000);
  const [trainProgress, setTrainProgress] = useState(0.25);

  // Animate train progress & shockwave pulses continuously
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseRadius(prev => (prev >= 110000 ? 30000 : prev + 8000));
      setTrainProgress(prev => (prev >= 0.96 ? 0.04 : prev + 0.012));
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // Primary Active Coaching Corridor: MAS -> AJJ -> KPD -> JTJ -> SA -> ED -> TUP -> CBE
  const activeCorridorCoords: [number, number][] = [
    [13.0827, 80.2707], // MAS (Chennai)
    [13.0818, 79.6384], // AJJ (Arakkonam)
    [12.9698, 79.1325], // KPD (Katpadi)
    [12.5975, 78.5833], // JTJ (Jolarpettai)
    [11.6643, 78.1460], // SA (Salem)
    [11.3410, 77.7172], // ED (Erode)
    [11.1085, 77.3411], // TUP (Tiruppur)
    [11.0168, 76.9558], // CBE (Coimbatore)
  ];

  // Secondary Railway Network Tracks across India
  const nationalTracks: [number, number][][] = [
    [[13.0827, 80.2707], [16.5062, 80.6480]], // MAS - BZA
    [[16.5062, 80.6480], [17.7041, 83.2977]], // BZA - VSKP
    [[16.5062, 80.6480], [17.3850, 78.4867]], // BZA - HYB
    [[12.5975, 78.5833], [12.9774, 77.5708]], // JTJ - SBC (Bangalore)
    [[28.6447, 77.2194], [27.1767, 78.0081]], // NDLS - AGC
    [[27.1767, 78.0081], [26.2183, 78.1828]], // AGC - GWL
    [[26.2183, 78.1828], [25.4484, 78.5685]], // GWL - JHS
    [[25.4484, 78.5685], [23.2599, 77.4126]], // JHS - BPL
    [[23.2599, 77.4126], [22.7533, 77.7249]], // BPL - ET
    [[22.7533, 77.7249], [21.1458, 79.0882]], // ET - NGP
    [[21.1458, 79.0882], [19.9548, 79.2961]], // NGP - BPQ
    [[19.9548, 79.2961], [16.5062, 80.6480]], // BPQ - BZA
    [[18.9398, 72.8354], [19.2437, 73.1355]], // CSTM - KYN
    [[19.2437, 73.1355], [18.5204, 73.8567]], // KYN - PUNE
    [[18.5204, 73.8567], [17.6599, 75.9064]], // PUNE - SUR
    [[18.9398, 72.8354], [21.1702, 72.8311]], // CSTM - ST
    [[21.1702, 72.8311], [22.3072, 73.1812]], // ST - BRC
    [[22.3072, 73.1812], [23.0225, 72.5714]], // BRC - ADI
    [[22.5831, 88.3426], [22.3460, 87.2320]], // HWH - KGP
    [[22.3460, 87.2320], [22.8046, 86.2029]], // KGP - TATA
  ];

  // Dynamic Signals placed along the active corridor blocks
  const dynamicSignals: Array<{ id: string; lat: number; lon: number; aspect: string; name: string }> = [
    { id: 'SIG-MAS-AJJ', lat: 13.0822, lon: 79.9545, aspect: disruptedStation ? 'RED' : 'GREEN', name: 'AS-104 (MAS-AJJ)' },
    { id: 'SIG-AJJ-KPD', lat: 13.0258, lon: 79.3854, aspect: disruptedStation ? 'DOUBLE_YELLOW' : 'GREEN', name: 'AS-142 (AJJ-KPD)' },
    { id: 'SIG-KPD-JTJ', lat: 12.7836, lon: 78.8579, aspect: disruptedStation ? 'YELLOW' : 'GREEN', name: 'HS-201 (KPD-JTJ)' },
    { id: 'SIG-JTJ-SA',  lat: 12.1309, lon: 78.3646, aspect: 'GREEN', name: 'AS-268 (JTJ-SA)' },
    { id: 'SIG-SA-ED',   lat: 11.5026, lon: 77.9316, aspect: 'GREEN', name: 'AS-312 (SA-ED)' },
    { id: 'SIG-ED-CBE',  lat: 11.0626, lon: 77.1484, aspect: 'GREEN', name: 'SS-405 (ED-CBE)' },
  ];

  // Interpolate Train 12673 moving coordinate
  const totalSegments = activeCorridorCoords.length - 1;
  const rawIdx = trainProgress * totalSegments;
  const segIndex = Math.min(Math.floor(rawIdx), totalSegments - 1);
  const segFraction = rawIdx - segIndex;
  const pA = activeCorridorCoords[segIndex];
  const pB = activeCorridorCoords[Math.min(segIndex + 1, totalSegments)];
  const trainLat = pA[0] + (pB[0] - pA[0]) * segFraction;
  const trainLon = pA[1] + (pB[1] - pA[1]) * segFraction;

  const disruptedStnObj = disruptedStation ? stationLookup.get(disruptedStation) : null;

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden border border-[#1E2D4A] bg-[#040711]">
      {/* Top Left OCC Telemetry HUD */}
      <div className="absolute top-3 left-3 z-[25] flex flex-col space-y-1 font-mono text-xs pointer-events-none">
        <span className="px-2.5 py-1 font-bold bg-[#0A0F1E]/95 text-cyan-300 border border-cyan-500/40 rounded backdrop-blur shadow-lg flex items-center space-x-1.5">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>2D OCC TACTICAL MAP — LIVE SIGNALLING & TRACK OCCUPANCY</span>
        </span>
        <div className="px-2 py-0.5 text-[10px] bg-[#0A0F1E]/90 text-slate-300 border border-slate-700/60 rounded backdrop-blur max-w-sm">
          Active Train: <b className="text-cyan-300">12673 Cheran Express</b> (MAS → CBE) | ABS Signalling Active
        </div>
      </div>

      {/* Signal Aspect Legend */}
      <div className="absolute top-16 left-3 z-[25] bg-[#0A0F1E]/95 border border-[#1E2D4A] rounded p-2 font-mono text-[10px] space-y-1 backdrop-blur shadow-xl">
        <div className="font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center space-x-1">
          <Navigation className="w-3 h-3 text-cyan-400" />
          <span>Signals (ABS)</span>
        </div>
        <div className="flex items-center space-x-1.5 text-emerald-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]"></span>
          <span>GREEN (Clear)</span>
        </div>
        <div className="flex items-center space-x-1.5 text-yellow-400">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]"></span>
          <span>DBL YELLOW</span>
        </div>
        <div className="flex items-center space-x-1.5 text-amber-400">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></span>
          <span>YELLOW</span>
        </div>
        <div className="flex items-center space-x-1.5 text-rose-400">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]"></span>
          <span>RED (Occupied)</span>
        </div>
      </div>

      <MapContainer
        center={[15.2, 78.8]}
        zoom={6}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* 1. National Track Network Lines */}
        {nationalTracks.map((c, idx) => (
          <Polyline
            key={`national-track-${idx}`}
            positions={c}
            pathOptions={{
              color: '#334155',
              weight: 2.5,
              opacity: 0.85,
            }}
          />
        ))}

        {/* 2. Highlighted Active Train Route Glow Polyline */}
        <Polyline
          positions={activeCorridorCoords}
          pathOptions={{
            color: '#00f0ff',
            weight: 5,
            opacity: 0.95,
          }}
        />

        {/* 3. Pulsing Disruption Shockwave at Incident Station */}
        {disruptedStnObj && (
          <>
            <Circle
              center={[disruptedStnObj.lat, disruptedStnObj.lon]}
              radius={pulseRadius}
              pathOptions={{
                color: '#ff3366',
                fillColor: '#ff3366',
                fillOpacity: 0.18,
                weight: 2,
                dashArray: '6, 6',
              }}
            />
            <Circle
              center={[disruptedStnObj.lat, disruptedStnObj.lon]}
              radius={pulseRadius * 0.5}
              pathOptions={{
                color: '#ff3366',
                fillColor: '#ff3366',
                fillOpacity: 0.3,
                weight: 1.5,
              }}
            />
          </>
        )}

        {/* 4. Dynamic Automatic Block Signals along Track Sections */}
        {dynamicSignals.map(sig => {
          const sigColor =
            sig.aspect === 'RED'
              ? '#ff3366'
              : sig.aspect === 'DOUBLE_YELLOW'
              ? '#facc15'
              : sig.aspect === 'YELLOW'
              ? '#ffb800'
              : '#00ff88';

          return (
            <CircleMarker
              key={sig.id}
              center={[sig.lat, sig.lon]}
              radius={6}
              pathOptions={{
                color: '#ffffff',
                fillColor: sigColor,
                fillOpacity: 1,
                weight: 1.5,
              }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={0.95} permanent={false}>
                <div className="text-xs font-mono">
                  <div className="font-bold text-white">{sig.name}</div>
                  <div className="text-[10px] mt-0.5 font-bold" style={{ color: sigColor }}>
                    Aspect: {sig.aspect}
                  </div>
                  <div className="text-[9px] text-slate-300">Track Circuit: {sig.aspect === 'RED' ? 'OCCUPIED' : 'CLEAR'}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* 5. Permanent High-Contrast Station Labels & Marker Nodes */}
        {stations.map(stn => {
          const isDisrupted = disruptedStation === stn.station_code;
          const isAffected = affectedStations.includes(stn.station_code);
          const color = isDisrupted ? '#ff3366' : isAffected ? '#ffb800' : '#00f0ff';

          return (
            <React.Fragment key={stn.station_code}>
              <CircleMarker
                center={[stn.lat, stn.lon]}
                radius={isDisrupted ? 11 : isAffected ? 9 : 6.5}
                pathOptions={{
                  color: '#ffffff',
                  fillColor: color,
                  fillOpacity: 1,
                  weight: isDisrupted ? 3 : 1.5,
                }}
              >
                {/* Permanent Station Code Badge */}
                <Tooltip direction="right" offset={[10, 0]} opacity={0.95} permanent={true}>
                  <div className="text-[10px] font-mono font-bold tracking-wider text-white">
                    <span style={{ color: color }}>{stn.station_code}</span>
                  </div>
                </Tooltip>

                <Popup>
                  <div className="text-xs font-mono p-1">
                    <div className="font-bold text-cyan-300 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{stn.station_code} ({stn.zone})</span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1">Historical Delay: {stn.delay_index} min</div>
                    {isDisrupted && <div className="text-rose-400 font-bold mt-1">DISRUPTION ORIGIN (+15m)</div>}
                    {isAffected && <div className="text-amber-300 font-bold mt-1">DOWNSTREAM CASCADE</div>}
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          );
        })}

        {/* 6. Real-Time Moving Active Train 12673 Marker with Label */}
        <CircleMarker
          center={[trainLat, trainLon]}
          radius={10}
          pathOptions={{
            color: '#ffffff',
            fillColor: disruptedTrain === selectedTrain ? '#ff3366' : '#00f0ff',
            fillOpacity: 1,
            weight: 3,
          }}
          eventHandlers={{
            click: () => onSelectTrain(selectedTrain),
          }}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={0.95} permanent={true}>
            <div className="text-[10px] font-mono font-black text-cyan-300 bg-[#0A0F1E] px-1 py-0.5 rounded border border-cyan-500">
              🚆 12673 (78 km/h)
            </div>
          </Tooltip>

          <Popup>
            <div className="text-xs font-mono p-1">
              <div className="font-black text-cyan-400 flex items-center space-x-1">
                <Navigation className="w-3.5 h-3.5" />
                <span>TRAIN {selectedTrain} (LIVE TELEMETRY)</span>
              </div>
              <div className="text-[11px] text-slate-300 mt-1">Cheran Superfast Express</div>
              <div className="mt-1 text-slate-400">Position: Between MAS & CBE</div>
              <div className="font-bold text-amber-300 mt-1">
                Delay: {disruptedTrain === selectedTrain ? '+15.0 min' : '+2.0 min'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Speed: 78 km/h | ABS Headway: Clear</div>
            </div>
          </Popup>
        </CircleMarker>

        {/* 7. Other Active Trains in Fleet */}
        {trains.filter(t => t.train_number !== selectedTrain).map(t => {
          const stn = stationLookup.get(t.current_station);
          if (!stn) return null;
          const isDisrupted = disruptedTrain === t.train_number;
          const color = isDisrupted ? '#ff3366' : t.delay_minutes > 10 ? '#ffb800' : '#00ff88';

          return (
            <CircleMarker
              key={t.train_number}
              center={[stn.lat + 0.08, stn.lon + 0.08]}
              radius={7}
              pathOptions={{
                color: '#ffffff',
                fillColor: color,
                fillOpacity: 1,
                weight: 1.5,
              }}
              eventHandlers={{
                click: () => onSelectTrain(t.train_number),
              }}
            >
              <Tooltip direction="bottom" offset={[0, 8]} opacity={0.9} permanent={true}>
                <div className="text-[9px] font-mono font-bold text-slate-200">
                  T{t.train_number}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};
