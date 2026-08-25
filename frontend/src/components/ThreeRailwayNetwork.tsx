import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Camera, Eye, Disc } from 'lucide-react';

interface Station3D {
  station_code: string;
  lat: number;
  lon: number;
  zone: string;
  delay_index: number;
}

interface Train3D {
  train_number: string;
  train_name: string;
  current_station: string;
  delay_minutes: number;
  status: string;
  priority: number;
}

interface ThreeRailwayProps {
  stations: Station3D[];
  trains: Train3D[];
  selectedTrain: string;
  onSelectTrain: (trainNo: string) => void;
  disruptedTrain: string | null;
  disruptedStation: string | null;
  affectedStations: string[];
  weatherCondition: string;
  currentDelay?: number;
  isApplied?: boolean;
}

// Convert Geo coordinates to 3D Scene Coordinates
function geoTo3D(lat: number, lon: number, height = 0): [number, number, number] {
  const x = (lon - 78.5) * 1.5;
  const y = (lat - 16.5) * 1.5;
  return [x, y, height];
}

// 3D Signal Gantry Tower at Track Junctions
const SignalGantry3D: React.FC<{
  position: [number, number, number];
  aspect: 'GREEN' | 'YELLOW' | 'DOUBLE_YELLOW' | 'RED';
  label: string;
}> = ({ position, aspect, label }) => {
  const lightRef = useRef<THREE.PointLight>(null);
  const color =
    aspect === 'RED'
      ? '#ff3366'
      : aspect === 'DOUBLE_YELLOW'
      ? '#facc15'
      : aspect === 'YELLOW'
      ? '#ffb800'
      : '#00ff88';

  useFrame(({ clock }) => {
    if (lightRef.current && aspect === 'RED') {
      lightRef.current.intensity = 1.5 + Math.sin(clock.getElapsedTime() * 6) * 0.8;
    }
  });

  return (
    <group position={position}>
      {/* Signal Post */}
      <mesh position={[0, 0, 0.35]}>
        <cylinderGeometry args={[0.03, 0.04, 0.7, 8]} />
        <meshStandardMaterial color="#475569" roughness={0.5} />
      </mesh>
      {/* Signal Head */}
      <mesh position={[0, 0, 0.7]}>
        <boxGeometry args={[0.12, 0.12, 0.22]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Glowing LED Lens */}
      <mesh position={[0, 0.06, 0.7]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.0}
        />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0.1, 0.7]} color={color} intensity={1.2} distance={2.5} />
      <Text position={[0, 0, 0.95]} fontSize={0.12} color="#94a3b8" anchorX="center">
        {label}
      </Text>
    </group>
  );
};

// 3D Volumetric Disruption Shockwave Rings
const DisruptionShockwave3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring1Ref.current) {
      const s1 = 1 + (t % 2) * 2.5;
      ring1Ref.current.scale.set(s1, s1, 1);
      (ring1Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - (t % 2) / 2);
    }
    if (ring2Ref.current) {
      const s2 = 1 + ((t + 1) % 2) * 2.5;
      ring2Ref.current.scale.set(s2, s2, 1);
      (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - ((t + 1) % 2) / 2);
    }
  });

  return (
    <group position={position}>
      <mesh ref={ring1Ref} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.4, 0.5, 32]} />
        <meshBasicMaterial color="#ff3366" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.4, 0.5, 32]} />
        <meshBasicMaterial color="#ff3366" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// 3D Station Marker Node
const StationNode3D: React.FC<{
  station: Station3D;
  isDisrupted: boolean;
  isAffected: boolean;
  onClick: () => void;
}> = ({ station, isDisrupted, isAffected, onClick }) => {
  const pos = useMemo(() => geoTo3D(station.lat, station.lon, 0.1), [station.lat, station.lon]);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current && (isDisrupted || isAffected)) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.2;
      meshRef.current.scale.set(s, s, s);
    }
  });

  const color = isDisrupted ? '#ff3366' : isAffected ? '#ffb800' : '#00f0ff';

  return (
    <group position={pos}>
      {/* Hexagonal Station Pedestal */}
      <mesh position={[0, 0, -0.05]}>
        <cylinderGeometry args={[0.3, 0.35, 0.1, 6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} />
      </mesh>

      {/* Glowing Core Sphere */}
      <mesh ref={meshRef} position={[0, 0, 0.1]} onClick={onClick}>
        <sphereGeometry args={[0.24, 20, 20]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isDisrupted ? 1.8 : 0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Disruption Pulsing Rings */}
      {isDisrupted && <DisruptionShockwave3D position={[0, 0, 0.1]} />}

      {/* Station Code Label */}
      <Text
        position={[0, -0.45, 0.2]}
        fontSize={0.24}
        color={isDisrupted ? '#fca5a5' : '#e2e8f0'}
        anchorX="center"
        anchorY="top"
        fontWeight={800}
      >
        {station.station_code}
      </Text>
    </group>
  );
};

// 3D Animated Train Locomotive
const AnimatedTrain3D: React.FC<{
  corridorPoints: [number, number, number][];
  train: Train3D;
  isSelected: boolean;
  isDisrupted: boolean;
  onClick: () => void;
}> = ({ corridorPoints, train, isSelected, isDisrupted, onClick }) => {
  const trainGroupRef = useRef<THREE.Group>(null);
  const color = isDisrupted ? '#ff3366' : train.delay_minutes > 10 ? '#ffb800' : '#00ff88';

  // Continuous movement along corridor spline
  const curve = useMemo(() => {
    const pts = corridorPoints.map(p => new THREE.Vector3(p[0], p[1], p[2] + 0.2));
    return new THREE.CatmullRomCurve3(pts);
  }, [corridorPoints]);

  useFrame(({ clock }) => {
    if (trainGroupRef.current && curve) {
      const loopTime = 20; // seconds for full run
      const progress = (clock.getElapsedTime() % loopTime) / loopTime;
      const point = curve.getPointAt(progress);
      const tangent = curve.getTangentAt(progress);

      trainGroupRef.current.position.copy(point);
      trainGroupRef.current.lookAt(point.clone().add(tangent));
    }
  });

  return (
    <group ref={trainGroupRef} onClick={onClick}>
      {/* Train Body */}
      <mesh>
        <boxGeometry args={[0.25, 0.45, 0.22]} />
        <meshStandardMaterial
          color={isSelected ? '#00f0ff' : color}
          emissive={color}
          emissiveIntensity={isSelected ? 1.4 : 0.7}
        />
      </mesh>
      {/* Front Headlight Spotlight */}
      <spotLight
        position={[0, 0.3, 0.1]}
        target-position={[0, 2, 0]}
        color="#ffffff"
        intensity={2.5}
        distance={4}
        angle={Math.PI / 6}
      />
      {/* Train Label Banner */}
      <Text position={[0, 0, 0.35]} fontSize={0.16} color="#ffffff" anchorX="center">
        {`T${train.train_number}`}
      </Text>
    </group>
  );
};

export const ThreeRailwayNetwork: React.FC<ThreeRailwayProps> = ({
  stations,
  trains,
  selectedTrain,
  onSelectTrain,
  disruptedTrain,
  disruptedStation,
  affectedStations,
  weatherCondition,
  currentDelay = 15.0,
  isApplied = false,
}) => {
  const [cameraView, setCameraView] = useState<'OVERVIEW' | 'SR' | 'TACTICAL'>('OVERVIEW');
  const controlsRef = useRef<any>(null);

  const stationMap = useMemo(() => {
    const map = new Map<string, Station3D>();
    stations.forEach(s => map.set(s.station_code, s));
    return map;
  }, [stations]);

  // Primary Active Corridor Coordinates in 3D: MAS -> AJJ -> KPD -> JTJ -> SA -> ED -> TUP -> CBE
  const activeCorridor3D = useMemo(() => {
    const codes = ['MAS', 'AJJ', 'KPD', 'JTJ', 'SA', 'ED', 'TUP', 'CBE'];
    const pts: [number, number, number][] = [];
    codes.forEach(c => {
      const stn = stationMap.get(c);
      if (stn) pts.push(geoTo3D(stn.lat, stn.lon, 0.1));
    });
    return pts;
  }, [stationMap]);

  // Other Network Corridors
  const networkCorridors = useMemo(() => {
    const lines: [number, number, number][][] = [];
    const pairs = [
      ['MAS', 'BZA'], ['BZA', 'VSKP'], ['BZA', 'HYB'], ['JTJ', 'SBC'],
      ['NDLS', 'AGC'], ['AGC', 'GWL'], ['GWL', 'JHS'], ['JHS', 'BPL'],
      ['BPL', 'ET'], ['ET', 'NGP'], ['NGP', 'BPQ'], ['BPQ', 'BZA'],
      ['CSTM', 'KYN'], ['KYN', 'PUNE'], ['PUNE', 'SUR'], ['CSTM', 'ST'],
      ['ST', 'BRC'], ['BRC', 'ADI'], ['HWH', 'KGP'], ['KGP', 'TATA'],
    ];

    pairs.forEach(([s1, s2]) => {
      const st1 = stationMap.get(s1);
      const st2 = stationMap.get(s2);
      if (st1 && st2) {
        const p1 = geoTo3D(st1.lat, st1.lon, 0);
        const p2 = geoTo3D(st2.lat, st2.lon, 0);
        lines.push([p1, p2]);
      }
    });
    return lines;
  }, [stationMap]);

  // Signals in 3D
  const signals3D = [
    { pos: [1.5, -4.5, 0.1] as [number, number, number], aspect: (disruptedStation ? 'RED' : 'GREEN') as any, label: 'AS-104 (MAS-AJJ)' },
    { pos: [0.8, -5.2, 0.1] as [number, number, number], aspect: (disruptedStation ? 'DOUBLE_YELLOW' : 'GREEN') as any, label: 'AS-142 (AJJ-KPD)' },
    { pos: [0.1, -5.8, 0.1] as [number, number, number], aspect: (disruptedStation ? 'YELLOW' : 'GREEN') as any, label: 'HS-201 (KPD-JTJ)' },
    { pos: [-0.6, -6.6, 0.1] as [number, number, number], aspect: 'GREEN' as any, label: 'AS-268 (JTJ-SA)' },
  ];

  const handleSetView = (view: 'OVERVIEW' | 'SR' | 'TACTICAL') => {
    setCameraView(view);
    if (!controlsRef.current) return;
    if (view === 'OVERVIEW') {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.object.position.set(0, -4, 16);
    } else if (view === 'SR') {
      controlsRef.current.target.set(0.5, -5.5, 0);
      controlsRef.current.object.position.set(0.5, -8, 8);
    } else {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.object.position.set(0, 0, 18);
    }
  };

  const activeTrainObj = trains.find(t => t.train_number === selectedTrain) || trains[0];

  return (
    <div className="w-full h-full relative bg-[#040711] select-none rounded-lg overflow-hidden border border-[#1E2D4A]">
      {/* Top HUD Badges */}
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-2 font-mono">
        <span className="px-2.5 py-1 text-xs font-bold bg-[#0A0F1E]/90 text-cyan-300 border border-cyan-500/40 rounded backdrop-blur flex items-center space-x-1.5 shadow-lg">
          <Disc className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span>3D HOLOGRAPHIC OCC TWIN — REAL-TIME NETWORK GRAPH G(t)</span>
        </span>
        <span className="px-2 py-1 text-xs bg-[#121A2F]/90 text-slate-300 border border-slate-700 rounded backdrop-blur">
          WEATHER: {weatherCondition}
        </span>
      </div>

      {/* Camera View Presets */}
      <div className="absolute top-3 right-3 z-10 flex items-center space-x-1 font-mono text-xs">
        <button
          onClick={() => handleSetView('OVERVIEW')}
          className={`px-2.5 py-1 rounded border transition ${
            cameraView === 'OVERVIEW'
              ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500 font-bold'
              : 'bg-[#0A0F1E]/80 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          <span className="flex items-center space-x-1">
            <Eye className="w-3 h-3" />
            <span>FULL NETWORK</span>
          </span>
        </button>
        <button
          onClick={() => handleSetView('SR')}
          className={`px-2.5 py-1 rounded border transition ${
            cameraView === 'SR'
              ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500 font-bold'
              : 'bg-[#0A0F1E]/80 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          <span>SR CORRIDOR (MAS-CBE)</span>
        </button>
        <button
          onClick={() => handleSetView('TACTICAL')}
          className={`px-2.5 py-1 rounded border transition ${
            cameraView === 'TACTICAL'
              ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500 font-bold'
              : 'bg-[#0A0F1E]/80 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          <span className="flex items-center space-x-1">
            <Camera className="w-3 h-3" />
            <span>TOP-DOWN TACTICAL</span>
          </span>
        </button>
      </div>

      <div className="absolute bottom-3 right-3 z-10 text-[10px] font-mono text-slate-400 bg-[#0A0F1E]/90 px-2.5 py-1 rounded border border-slate-800 backdrop-blur">
        Orbit: Left Click + Drag | Pan: Right Click + Drag | Zoom: Scroll
      </div>

      <Canvas camera={{ position: [0, -4, 16], fov: 45 }}>
        <ambientLight intensity={0.45} />
        <pointLight position={[10, 10, 20]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-10, -10, 10]} intensity={0.8} color="#00f0ff" />
        <pointLight position={[0, -5, 5]} intensity={1.0} color="#38bdf8" />

        {/* 3D Coordinate Grid Floor */}
        <gridHelper args={[40, 40, '#00f0ff', '#1e293b']} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.3]} />

        {/* National Network Tracks */}
        {networkCorridors.map((pts, idx) => (
          <Line
            key={`corridor-${idx}`}
            points={pts}
            color="#1e293b"
            lineWidth={1.5}
            transparent
            opacity={0.7}
          />
        ))}

        {/* Glowing Active Coaching Route (MAS -> CBE) */}
        {activeCorridor3D.length > 1 && (
          <Line
            points={activeCorridor3D}
            color={
              isApplied
                ? '#10b981'
                : currentDelay >= 20
                ? '#ff3366'
                : currentDelay >= 10
                ? '#ffb800'
                : '#00f0ff'
            }
            lineWidth={isApplied ? 5.5 : currentDelay >= 20 ? 5.5 : 4}
            transparent
            opacity={0.95}
          />
        )}

        {/* 3D Signal Gantry Towers */}
        {signals3D.map((sig, idx) => (
          <SignalGantry3D
            key={`sig-${idx}`}
            position={sig.pos}
            aspect={sig.aspect}
            label={sig.label}
          />
        ))}

        {/* 3D Station Nodes */}
        {stations.map(station => (
          <StationNode3D
            key={station.station_code}
            station={station}
            isDisrupted={disruptedStation === station.station_code}
            isAffected={affectedStations.includes(station.station_code)}
            onClick={() => {}}
          />
        ))}

        {/* Animated Moving Train 12673 */}
        {activeCorridor3D.length > 1 && activeTrainObj && (
          <AnimatedTrain3D
            corridorPoints={activeCorridor3D}
            train={activeTrainObj}
            isSelected={selectedTrain === activeTrainObj.train_number}
            isDisrupted={disruptedTrain === activeTrainObj.train_number}
            onClick={() => onSelectTrain(activeTrainObj.train_number)}
          />
        )}

        <OrbitControls
          ref={controlsRef}
          enableRotate={true}
          enableZoom={true}
          enablePan={true}
          maxDistance={35}
          minDistance={3}
        />
      </Canvas>
    </div>
  );
};
