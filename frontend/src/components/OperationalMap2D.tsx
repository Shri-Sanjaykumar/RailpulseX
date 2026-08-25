import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ArrowUpDown,
  Filter,
  Search,
  PlusCircle,
  Clock,
  Gauge,
  Layers,
  ChevronDown,
  Activity,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { StationETAItem } from './MultiStationJourneyModal';

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
  currentDelay?: number;
  upcomingStations?: StationETAItem[];
  isApplied?: boolean;
  onOpenJourney?: () => void;
  onOpenWhatIf?: () => void;
  onInjectDisruption?: (delay: number) => void;
}

interface StationMeta {
  fullName: string;
  division: string;
  role: string;
  platforms: number;
  electrification: string;
  sectionSpeed: string;
}

// Comprehensive Station Metadata Registry for Tamil Nadu & Indian Railways
const INDIAN_RAILWAYS_STATION_META: Record<string, StationMeta> = {
  // Main Coaching Corridor (MAS -> CBE)
  MAS: {
    fullName: 'Puratchi Thalaivar Dr. M.G.R. Chennai Central',
    division: 'Southern Railway (Chennai MAS Division HQ)',
    role: 'Primary Origin & Terminal Coaching Hub (17 Platforms, 250+ Trains/day)',
    platforms: 17,
    electrification: '25 kV AC Double Line',
    sectionSpeed: '130 km/h Automatic Block Signalling (ABS)',
  },
  AJJ: {
    fullName: 'Arakkonam Junction',
    division: 'Southern Railway (Chennai MAS Division)',
    role: 'Major Quadruple-Track Junction & WAP-4/WAP-7 Electric Loco Shed',
    platforms: 5,
    electrification: '25 kV AC Quadruple Line',
    sectionSpeed: '130 km/h ABS Route',
  },
  KPD: {
    fullName: 'Katpadi Junction (Vellore)',
    division: 'Southern Railway (Chennai MAS Division)',
    role: 'Key Interstate Tri-Junction (Chennai / Bengaluru / Tirupati lines)',
    platforms: 5,
    electrification: '25 kV AC Double Line',
    sectionSpeed: '110 km/h Colour Light Signalling',
  },
  JTJ: {
    fullName: 'Jolarpettai Junction',
    division: 'Southern Railway (Chennai MAS Division)',
    role: 'Division Boundary & Bengaluru Main Line Diverging Node',
    platforms: 5,
    electrification: '25 kV AC Double Line',
    sectionSpeed: '110 km/h Colour Light Signalling',
  },
  SA: {
    fullName: 'Salem Junction',
    division: 'Southern Railway (Salem Division HQ)',
    role: 'Divisional Headquarters & Western Tamil Nadu Main Interchange',
    platforms: 6,
    electrification: '25 kV AC Double Line',
    sectionSpeed: '110 km/h Colour Light Signalling',
  },
  ED: {
    fullName: 'Erode Junction',
    division: 'Southern Railway (Salem Division)',
    role: 'Major Electric/Diesel Loco Shed Hub & Kerala Main Line Divergence',
    platforms: 4,
    electrification: '25 kV AC Double Line',
    sectionSpeed: '110 km/h Colour Light Signalling',
  },
  TUP: {
    fullName: 'Tiruppur',
    division: 'Southern Railway (Salem Division)',
    role: 'High-Density Textile Export Hub & Superfast Coaching Stop',
    platforms: 2,
    electrification: '25 kV AC Double Line',
    sectionSpeed: '110 km/h Colour Light Signalling',
  },
  CBE: {
    fullName: 'Coimbatore Main Junction',
    division: 'Southern Railway (Salem Division)',
    role: 'Major Industrial Terminus & Western Tamil Nadu Coaching Base',
    platforms: 6,
    electrification: '25 kV AC Double Line',
    sectionSpeed: '110 km/h Colour Light Signalling',
  },

  // Tamil Nadu Regional Stations
  DPI: {
    fullName: 'Dharmapuri Junction',
    division: 'South Western Railway (Bengaluru Division)',
    role: 'Hosur - Salem Bypass Line Interchange',
    platforms: 3,
    electrification: '25 kV AC Single Line',
    sectionSpeed: '100 km/h Absolute Block Signalling',
  },
  MPLY: {
    fullName: 'Mayiladuthurai / Marapalam',
    division: 'Southern Railway (Tiruchirappalli Division)',
    role: 'Cauvery Delta Chord Line Junction',
    platforms: 4,
    electrification: '25 kV AC Double Line',
    sectionSpeed: '100 km/h Absolute Block Signalling',
  },
  KLS: {
    fullName: 'Kulittalai / Kalas',
    division: 'Southern Railway (Tiruchirappalli Division)',
    role: 'Cauvery River Basin Passenger & Freight Crossing Station',
    platforms: 2,
    electrification: '25 kV AC Double Line',
    sectionSpeed: '100 km/h Absolute Block Signalling',
  },
  AIP: {
    fullName: 'Attippattu Freight Terminal (Ennore)',
    division: 'Southern Railway (Chennai MAS Division)',
    role: 'Chennai Port & Ennore Thermal Coal Freight Corridor Node',
    platforms: 3,
    electrification: '25 kV AC Quadruple Line',
    sectionSpeed: '100 km/h Freight ABS Line',
  },
  TPJ: {
    fullName: 'Tiruchirappalli Junction',
    division: 'Southern Railway (TPJ Division HQ)',
    role: 'Divisional Headquarters & Central Tamil Nadu Hub (8 Platforms)',
    platforms: 8,
    electrification: '25 kV AC Double Line',
    sectionSpeed: '110 km/h Colour Light Signalling',
  },
  MDU: {
    fullName: 'Madurai Junction',
    division: 'Southern Railway (Madurai Division HQ)',
    role: 'Southern Tamil Nadu Primary Coaching Terminal',
    platforms: 8,
    electrification: '25 kV AC Double Line',
    sectionSpeed: '110 km/h Colour Light Signalling',
  },
  DG: {
    fullName: 'Dindigul Junction',
    division: 'Southern Railway (Madurai Division)',
    role: 'Karur / Madurai / Pollachi Tri-Junction Node',
    platforms: 5,
    electrification: '25 kV AC Double Line',
    sectionSpeed: '110 km/h Colour Light Signalling',
  },

  // Neighboring & National Interchanges
  SBC: {
    fullName: 'KSR Bengaluru City Junction',
    division: 'South Western Railway (SBC Division HQ)',
    role: 'Karnataka State Capital Coaching Terminal (10 Platforms)',
    platforms: 10,
    electrification: '25 kV AC Double Line',
    sectionSpeed: '110 km/h Automatic Block Signalling',
  },
  NLR: {
    fullName: 'Nellore',
    division: 'South Central Railway (Vijayawada Division)',
    role: 'Grand Trunk Route Coaching Station (Andhra Pradesh)',
    platforms: 4,
    electrification: '25 kV AC Triple Line',
    sectionSpeed: '130 km/h Grand Trunk Route',
  },
  ZPL: {
    fullName: 'Zampani',
    division: 'South Central Railway (Guntur Division)',
    role: 'SCR Loop Line Crossing Station (Andhra Pradesh)',
    platforms: 2,
    electrification: '25 kV AC Single Line',
    sectionSpeed: '90 km/h Absolute Block',
  },
  BZA: {
    fullName: 'Vijayawada Junction',
    division: 'South Central Railway (BZA Division HQ)',
    role: 'Grand Trunk National Superfast Interchange (10 Platforms)',
    platforms: 10,
    electrification: '25 kV AC Quadruple Line',
    sectionSpeed: '130 km/h Grand Trunk Route',
  },
  NDLS: {
    fullName: 'New Delhi Railway Station',
    division: 'Northern Railway (Delhi Division)',
    role: 'National Capital Primary Terminal (16 Platforms, 350+ Trains/day)',
    platforms: 16,
    electrification: '25 kV AC Multi-Track Line',
    sectionSpeed: '130 km/h Route-Relay Interlocking',
  },
  BPL: {
    fullName: 'Bhopal Junction',
    division: 'West Central Railway (Bhopal Division HQ)',
    role: 'Central India Main Line Interchange Hub',
    platforms: 6,
    electrification: '25 kV AC Double Line',
    sectionSpeed: '130 km/h Route-Relay Interlocking',
  },
  CSTM: {
    fullName: 'Chhatrapati Shivaji Maharaj Terminus (Mumbai)',
    division: 'Central Railway (Mumbai Division HQ)',
    role: 'UNESCO World Heritage Coaching Terminus (18 Platforms)',
    platforms: 18,
    electrification: '25 kV AC Quadruple Line',
    sectionSpeed: '110 km/h Suburban & Mainline Corridor',
  },
  HWH: {
    fullName: 'Howrah Junction (Kolkata)',
    division: 'Eastern Railway (Howrah Division HQ)',
    role: 'Largest Railway Station Complex in India (23 Platforms)',
    platforms: 23,
    electrification: '25 kV AC Multi-Track Corridor',
    sectionSpeed: '110 km/h Route-Relay Interlocking',
  },
};

// Map Controller for smooth flyTo animations
const MapFlyTo: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

// Custom Marker Pin Generator with Dynamic Color & Delay Badge (Notion / Google Maps style)
function createPinIcon(color: string, label: string, isPulsing = false, delayText = '') {
  const pulseClass = isPulsing ? 'animate-ping' : '';
  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
      ${isPulsing ? `<div class="${pulseClass}" style="position: absolute; top: -4px; width: 38px; height: 38px; border-radius: 50%; background: ${color}; opacity: 0.6;"></div>` : ''}
      <div style="width: 32px; height: 32px; border-radius: 50% 50% 50% 0; background: ${color}; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5); border: 2.5px solid #ffffff;">
        <div style="transform: rotate(45deg); font-weight: 900; font-size: 10px; color: #ffffff; font-family: monospace; letter-spacing: -0.5px;">
          ${label.slice(0, 4)}
        </div>
      </div>
      <div style="margin-top: 3px; background: rgba(10, 15, 30, 0.95); color: #ffffff; font-size: 9px; font-weight: bold; font-family: monospace; padding: 2px 6px; border-radius: 4px; border: 1.5px solid ${color}; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 3px;">
        <span>${label}</span>
        ${delayText ? `<span style="color: ${color}; font-weight: 900;">${delayText}</span>` : ''}
      </div>
    </div>
  `;
  return L.divIcon({
    className: 'custom-pin-marker',
    html: html,
    iconSize: [44, 52],
    iconAnchor: [22, 44],
    popupAnchor: [0, -42],
  });
}

// Custom Train Marker Icon (Moving capsule with live telemetry speed badge)
function createTrainIcon(trainNumber: string, speed: number, isDisrupted: boolean) {
  const color = isDisrupted ? '#ef4444' : '#06b6d4';
  const html = `
    <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
      <div style="background: ${color}; color: #040711; font-weight: 900; font-size: 10px; font-family: monospace; padding: 3px 7px; border-radius: 12px; border: 2px solid #ffffff; box-shadow: 0 0 14px ${color}; display: flex; align-items: center; gap: 4px;">
        <span>🚆</span>
        <span>${trainNumber}</span>
      </div>
      <div style="background: #0a0f1e; color: #38bdf8; font-size: 8px; font-family: monospace; font-weight: bold; padding: 1px 5px; border-radius: 3px; border: 1px solid #1e2d4a; margin-top: 2px;">
        ${speed} km/h
      </div>
    </div>
  `;
  return L.divIcon({
    className: 'custom-train-marker',
    html: html,
    iconSize: [64, 42],
    iconAnchor: [32, 21],
    popupAnchor: [0, -22],
  });
}

// Custom Signal Marker Icon (Traffic light styled ABS beacon)
function createSignalIcon(aspect: string) {
  const color =
    aspect === 'RED'
      ? '#ef4444'
      : aspect === 'DOUBLE_YELLOW'
      ? '#facc15'
      : aspect === 'YELLOW'
      ? '#f59e0b'
      : '#10b981';

  const html = `
    <div style="display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; background: #0f172a; border: 2px solid #ffffff; box-shadow: 0 0 8px ${color};">
      <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></div>
    </div>
  `;
  return L.divIcon({
    className: 'custom-signal-marker',
    html: html,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

export const OperationalMap2D: React.FC<OperationalMap2DProps> = ({
  stations,
  trains,
  selectedTrain,
  onSelectTrain,
  disruptedTrain,
  disruptedStation,
  affectedStations,
  currentDelay = 15.0,
  upcomingStations = [],
  isApplied = false,
  onOpenJourney,
  onOpenWhatIf,
  onInjectDisruption,
}) => {
  // Map Layer Themes
  const mapThemes = {
    voyager: {
      name: 'Voyager (Streets/Landmarks)',
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/">CartoDB Voyager</a>',
    },
    dark: {
      name: 'Dark OCC Tactical',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/">CartoDB DarkMatter</a>',
    },
    positron: {
      name: 'Positron (Clean Light)',
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/">CartoDB Positron</a>',
    },
  };

  const [activeTheme, setActiveTheme] = useState<'voyager' | 'dark' | 'positron'>('voyager');
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'DELAY' | 'NAME' | 'DISTANCE'>('DELAY');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.5, 78.8]);
  const [mapZoom, setMapZoom] = useState<number>(7);
  const [trainProgress, setTrainProgress] = useState(0.35);
  const [pulseRadius, setPulseRadius] = useState(30000);

  // Lookup map for dynamic journey ETA details per station
  const journeyLookup = useMemo(() => {
    const map = new Map<string, StationETAItem>();
    upcomingStations.forEach(s => map.set(s.station_code, s));
    return map;
  }, [upcomingStations]);

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

  // Dynamic Signals along the coaching corridor based on active disruption
  const dynamicSignals = [
    { id: 'SIG-MAS-AJJ', lat: 13.0822, lon: 79.9545, aspect: isApplied ? 'GREEN' : disruptedStation ? 'RED' : 'GREEN', name: 'Auto Signal AS-104 (MAS-AJJ)' },
    { id: 'SIG-AJJ-KPD', lat: 13.0258, lon: 79.3854, aspect: isApplied ? 'GREEN' : disruptedStation ? 'DOUBLE_YELLOW' : 'GREEN', name: 'Auto Signal AS-142 (AJJ-KPD)' },
    { id: 'SIG-KPD-JTJ', lat: 12.7836, lon: 78.8579, aspect: isApplied ? 'GREEN' : disruptedStation ? 'YELLOW' : 'GREEN', name: 'Home Signal HS-201 (KPD-JTJ)' },
    { id: 'SIG-JTJ-SA',  lat: 12.1309, lon: 78.3646, aspect: 'GREEN', name: 'Auto Signal AS-268 (JTJ-SA)' },
    { id: 'SIG-SA-ED',   lat: 11.5026, lon: 77.9316, aspect: 'GREEN', name: 'Auto Signal AS-312 (SA-ED)' },
    { id: 'SIG-ED-CBE',  lat: 11.0626, lon: 77.1484, aspect: 'GREEN', name: 'Starter Signal SS-405 (ED-CBE)' },
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

  // Filtered & Sorted Stations
  const filteredStations = useMemo(() => {
    return stations
      .filter(s => {
        const matchesZone = selectedZone === 'ALL' || s.zone === selectedZone;
        const matchesSearch =
          s.station_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (INDIAN_RAILWAYS_STATION_META[s.station_code]?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesZone && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'DELAY') return b.delay_index - a.delay_index;
        if (sortBy === 'NAME') return a.station_code.localeCompare(b.station_code);
        return a.lat - b.lat;
      });
  }, [stations, selectedZone, searchQuery, sortBy]);

  const stationLookup = useMemo(() => new Map(stations.map(s => [s.station_code, s])), [stations]);
  const disruptedStnObj = disruptedStation ? stationLookup.get(disruptedStation) : null;

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden border border-[#1E2D4A] bg-[#0A0F1E] flex flex-col font-sans select-none">
      {/* 1. Top Notion / FlightRadar Style Filter & Action Bar */}
      <div className="h-12 bg-[#0A0F1E] border-b border-[#1E2D4A] px-3 flex items-center justify-between z-30 text-xs font-mono text-slate-200">
        {/* Left: View Switcher & Result Count */}
        <div className="flex items-center space-x-2">
          {/* Map Layer Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setThemeDropdownOpen(prev => !prev)}
              className="px-2.5 py-1 bg-[#121A2F] hover:bg-[#1A2542] text-cyan-300 border border-cyan-500/40 rounded flex items-center space-x-1.5 transition shadow"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold">{mapThemes[activeTheme].name.split(' ')[0]}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {themeDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-[#0A0F1E] border border-cyan-500/50 rounded-lg shadow-2xl py-1 z-50">
                {(Object.keys(mapThemes) as Array<keyof typeof mapThemes>).map(key => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveTheme(key);
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-[#162036] transition flex items-center justify-between text-xs ${
                      activeTheme === key ? 'text-cyan-300 font-bold bg-[#121A2F]' : 'text-slate-300'
                    }`}
                  >
                    <span>{mapThemes[key].name}</span>
                    {activeTheme === key && <span className="text-[10px] text-cyan-400">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-slate-400 text-[11px] hidden sm:inline">
            <b className="text-white">{filteredStations.length + trains.length}</b> entities active
          </span>
        </div>

        {/* Center: Live Search Input */}
        <div className="flex-1 max-w-xs mx-3 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search train (12673) or station (MAS, KPD, Salem)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#121A2F] border border-[#1E2D4A] rounded pl-8 pr-2 py-1 text-[11px] text-white focus:outline-none focus:border-cyan-400 font-mono placeholder:text-slate-500"
          />
        </div>

        {/* Right: Sort & Filter Controls */}
        <div className="flex items-center space-x-2">
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortDropdownOpen(prev => !prev)}
              className="px-2 py-1 bg-[#121A2F] hover:bg-[#1A2542] text-slate-300 border border-[#1E2D4A] rounded flex items-center space-x-1 transition"
            >
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <span>Sort: {sortBy}</span>
            </button>
            {sortDropdownOpen && (
              <div className="absolute top-full right-0 mt-1 w-36 bg-[#0A0F1E] border border-[#1E2D4A] rounded-lg shadow-2xl py-1 z-50">
                {['DELAY', 'NAME', 'DISTANCE'].map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      setSortBy(s as any);
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-[#162036] text-xs ${
                      sortBy === s ? 'text-cyan-300 font-bold' : 'text-slate-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Zone Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterDropdownOpen(prev => !prev)}
              className="px-2 py-1 bg-[#121A2F] hover:bg-[#1A2542] text-slate-300 border border-[#1E2D4A] rounded flex items-center space-x-1 transition"
            >
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Zone: {selectedZone}</span>
            </button>
            {filterDropdownOpen && (
              <div className="absolute top-full right-0 mt-1 w-32 bg-[#0A0F1E] border border-[#1E2D4A] rounded-lg shadow-2xl py-1 z-50">
                {['ALL', 'SR', 'NR', 'CR', 'ER', 'SWR', 'SCR'].map(z => (
                  <button
                    key={z}
                    onClick={() => {
                      setSelectedZone(z);
                      setFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-[#162036] text-xs ${
                      selectedZone === z ? 'text-cyan-300 font-bold' : 'text-slate-300'
                    }`}
                  >
                    {z}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Inject Disruption Button */}
          {onInjectDisruption && (
            <button
              onClick={() => onInjectDisruption(currentDelay)}
              className="px-2.5 py-1 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded font-bold flex items-center space-x-1 transition shadow-lg shadow-red-900/30"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+{Math.round(currentDelay)}m Delay</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Leaflet Viewport Container */}
      <div className="flex-1 relative w-full h-full">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <MapFlyTo center={mapCenter} zoom={mapZoom} />

          {/* Dynamic Theme Tile Layer */}
          <TileLayer
            key={activeTheme}
            attribution={mapThemes[activeTheme].attribution}
            url={mapThemes[activeTheme].url}
          />

          {/* National Track Network Lines */}
          {nationalTracks.map((c, idx) => (
            <Polyline
              key={`national-track-${idx}`}
              positions={c}
              pathOptions={{
                color: activeTheme === 'voyager' ? '#64748b' : '#334155',
                weight: 2.5,
                opacity: 0.75,
              }}
            />
          ))}

          {/* Glowing Active Coaching Route (MAS -> CBE) with Dynamic Color */}
          <Polyline
            positions={activeCorridorCoords}
            pathOptions={{
              color: isApplied
                ? '#10b981'
                : currentDelay >= 20
                ? '#ef4444'
                : currentDelay >= 10
                ? '#f59e0b'
                : currentDelay > 0
                ? '#06b6d4'
                : activeTheme === 'voyager' ? '#0284c7' : '#00f0ff',
              weight: isApplied ? 6.5 : currentDelay >= 20 ? 6.5 : 5,
              opacity: 0.95,
              dashArray: currentDelay >= 20 && !isApplied ? '8, 8' : undefined,
            }}
          />

          {/* Pulsing Disruption Shockwave at Incident Epicenter */}
          {disruptedStnObj && !isApplied && (
            <>
              <Circle
                center={[disruptedStnObj.lat, disruptedStnObj.lon]}
                radius={pulseRadius}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: 0.15,
                  weight: 2,
                  dashArray: '6, 6',
                }}
              />
              <Circle
                center={[disruptedStnObj.lat, disruptedStnObj.lon]}
                radius={pulseRadius * 0.5}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: 0.25,
                  weight: 1.5,
                }}
              />
            </>
          )}

          {/* Dynamic Automatic Block Signals */}
          {dynamicSignals.map(sig => (
            <Marker
              key={sig.id}
              position={[sig.lat, sig.lon]}
              icon={createSignalIcon(sig.aspect)}
            >
              <Popup>
                <div className="text-xs font-mono p-1 space-y-1.5">
                  <div className="font-bold text-base text-cyan-400">{sig.name}</div>
                  <div className="text-slate-300">
                    Aspect:{' '}
                    <b
                      style={{
                        color:
                          sig.aspect === 'RED'
                            ? '#ef4444'
                            : sig.aspect === 'GREEN'
                            ? '#10b981'
                            : '#f59e0b',
                      }}
                    >
                      {sig.aspect}
                    </b>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Track Circuit: {sig.aspect === 'RED' ? 'OCCUPIED' : 'CLEAR'}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Interactive Notion/Airbnb Style Station Pins & Dynamic Color Tags */}
          {filteredStations.map(stn => {
            const isCorridor = ['MAS', 'AJJ', 'KPD', 'JTJ', 'SA', 'ED', 'TUP', 'CBE'].includes(stn.station_code);
            const isOriginIncident = disruptedStation === stn.station_code && !isApplied;
            const isAffected = affectedStations.includes(stn.station_code) && !isApplied;
            const journeyItem = journeyLookup.get(stn.station_code);

            const meta: StationMeta = INDIAN_RAILWAYS_STATION_META[stn.station_code] || {
              fullName: `${stn.station_code} Junction`,
              division: `${stn.zone || 'SR'} Zone`,
              role: 'Indian Railways Operational Station',
              platforms: 4,
              electrification: '25 kV AC Double Line',
              sectionSpeed: '100 km/h Colour Light Signalling',
            };

            const dynamicDelay = isApplied
              ? 0
              : isOriginIncident
              ? Math.round(currentDelay)
              : isCorridor && journeyItem
              ? journeyItem.predicted_delay_p50_min
              : isAffected
              ? Math.round(currentDelay * 0.7)
              : 0;

            // DYNAMIC COLOR COMPUTATION ACCORDING TO SEVERITY & SIMULATION STATE
            let pinColor = '#3b82f6'; // Clean Slate Blue for unaffected / regional stations (ZPL, NLR, AIP, DPI, MPLY, KLS, NDLS)
            let delayTag = '';

            if (isApplied) {
              if (isCorridor || isAffected) {
                pinColor = '#10b981'; // 🟢 Emerald (Intervention Applied & Verified)
                delayTag = '+0m';
              } else {
                pinColor = '#3b82f6'; // 🔵 Clean Blue for unrelated regional stations
                delayTag = '';
              }
            } else {
              // Active Disruption State
              if (isOriginIncident) {
                pinColor = '#ef4444'; // 🔴 Crimson Red (Incident Epicenter)
                delayTag = `+${Math.round(currentDelay)}m`;
              } else if (isCorridor && journeyItem) {
                delayTag = `+${dynamicDelay}m`;
                if (dynamicDelay >= 20) {
                  pinColor = '#ef4444'; // 🔴 Red
                } else if (dynamicDelay >= 12) {
                  pinColor = '#f97316'; // 🟠 Deep Orange
                } else if (dynamicDelay >= 5) {
                  pinColor = '#f59e0b'; // 🟡 Amber / Yellow
                } else {
                  pinColor = '#06b6d4'; // 🔵 Cyan
                }
              } else if (isAffected) {
                pinColor = '#f59e0b'; // 🟡 Amber (Knock-on)
                delayTag = `+${Math.round(currentDelay * 0.7)}m`;
              } else {
                pinColor = '#3b82f6'; // 🔵 Standard Blue for unrelated regional stations
                delayTag = '';
              }
            }

            return (
              <Marker
                key={stn.station_code}
                position={[stn.lat, stn.lon]}
                icon={createPinIcon(pinColor, stn.station_code, isOriginIncident, delayTag)}
                eventHandlers={{
                  click: () => {
                    setMapCenter([stn.lat, stn.lon]);
                    setMapZoom(8);
                  },
                }}
              >
                {/* Floating Dossier Card with Authentic Indian Railways & Tamil Nadu Metadata */}
                <Popup minWidth={290} maxWidth={360}>
                  <div className="font-sans text-xs p-1.5 space-y-2.5 text-slate-100">
                    <div>
                      <div className="font-bold text-sm leading-tight flex items-start justify-between gap-2" style={{ color: pinColor }}>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{meta.fullName}</span>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-[#121A2F] border font-mono" style={{ borderColor: pinColor, color: pinColor }}>
                          {meta.division}
                        </span>
                        <span className="text-slate-400 font-mono">{meta.platforms} Platforms</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-snug">{meta.role}</div>
                    </div>

                    <div className="space-y-1.5 bg-[#040711] p-2.5 rounded border border-[#1E2D4A] text-[11px] font-mono">
                      {isCorridor ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Dynamic Section Delay:</span>
                            <span className="font-bold" style={{ color: pinColor }}>
                              {isApplied ? '0.0 min (Regulated)' : `+${dynamicDelay} min`}
                            </span>
                          </div>
                          {journeyItem && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Predicted ETA (P50):</span>
                                <span className="text-cyan-300 font-bold">{journeyItem.predicted_eta_p50}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">P10 – P90 Interval:</span>
                                <span className="text-amber-300">{journeyItem.predicted_eta_p10} – {journeyItem.predicted_eta_p90}</span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-400">Track Circuit Status:</span>
                            <span className={isOriginIncident ? 'text-rose-400 font-bold' : isApplied ? 'text-emerald-400' : 'text-slate-200'}>
                              {isOriginIncident ? 'Platform Occupied (Hold Conflict)' : isApplied ? 'Green Clearance Window' : 'Scheduled Clearance'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Scheduled Operation:</span>
                            <span className="font-bold text-cyan-300">Normal (On-Time)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Section Speed:</span>
                            <span className="text-slate-200">{meta.sectionSpeed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Line Electrification:</span>
                            <span className="text-emerald-400">{meta.electrification}</span>
                          </div>
                        </>
                      )}

                      {isOriginIncident && (
                        <div className="text-rose-400 font-bold text-[10px] pt-1.5 border-t border-slate-800 flex items-center space-x-1">
                          <Activity className="w-3.5 h-3.5 text-rose-400 animate-pulse flex-shrink-0" />
                          <span>ACTIVE DISRUPTION EPICENTER (+{Math.round(currentDelay)}m)</span>
                        </div>
                      )}
                      {isApplied && isCorridor && (
                        <div className="text-emerald-400 font-bold text-[10px] pt-1.5 border-t border-slate-800 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>✓ CP-SAT REGULATION ORDER APPLIED & REFORECASTED</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Action Buttons inside Card */}
                    <div className="pt-1 flex items-center space-x-1.5 font-mono">
                      {onOpenJourney && (
                        <button
                          onClick={onOpenJourney}
                          className="flex-1 py-1.5 bg-cyan-600/30 hover:bg-cyan-600 text-cyan-300 hover:text-slate-950 border border-cyan-500 rounded text-[10px] font-bold transition text-center"
                        >
                          View Journey ETAs
                        </button>
                      )}
                      {onOpenWhatIf && (
                        <button
                          onClick={onOpenWhatIf}
                          className="flex-1 py-1.5 bg-[#121A2F] hover:bg-cyan-900 text-slate-200 rounded border border-[#1E2D4A] text-[10px] font-bold transition text-center"
                        >
                          What-If Simulation
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Real-Time Moving Active Train 12673 Pin & Dossier Card */}
          <Marker
            position={[trainLat, trainLon]}
            icon={createTrainIcon(selectedTrain, 78.5, disruptedTrain === selectedTrain && !isApplied)}
            eventHandlers={{
              click: () => onSelectTrain(selectedTrain),
            }}
          >
            <Popup minWidth={280} maxWidth={340}>
              <div className="font-sans text-xs p-1 space-y-2 text-slate-100">
                <div>
                  <div className="font-bold text-sm text-cyan-300 flex items-center justify-between">
                    <span>Train {selectedTrain}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                      Superfast Express
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">Cheran Superfast (MAS → CBE)</div>
                </div>

                <div className="space-y-1 bg-[#040711] p-2 rounded border border-[#1E2D4A] text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Operating Speed:</span>
                    <span className="font-bold text-cyan-300 flex items-center space-x-1">
                      <Gauge className="w-3 h-3" />
                      <span>78.5 km/h</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Delay:</span>
                    <span className="font-bold text-amber-300 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{isApplied ? '+0.0 min (Regulated)' : `+${Math.round(currentDelay)} min`}</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Next Stop:</span>
                    <span className="text-slate-200">Katpadi Jn (00:04 ± 11m)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Destination ETA:</span>
                    <span className="text-emerald-300">Coimbatore (05:51 ± 15m)</span>
                  </div>
                </div>

                {/* Quick Action Buttons inside Card */}
                <div className="pt-1 flex items-center space-x-1.5 font-mono">
                  {onOpenJourney && (
                    <button
                      onClick={onOpenJourney}
                      className="flex-1 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 rounded text-[10px] font-black transition text-center shadow"
                    >
                      Multi-Station Journey
                    </button>
                  )}
                  {onOpenWhatIf && (
                    <button
                      onClick={onOpenWhatIf}
                      className="flex-1 py-1.5 bg-[#121A2F] hover:bg-cyan-900 text-cyan-300 rounded border border-cyan-500/40 text-[10px] font-bold transition text-center"
                    >
                      What-If Simulation
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};
