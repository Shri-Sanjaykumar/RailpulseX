# RailPulse-X — Design System & Visual Specification (Google Stitch Standard)

## 1. Vision & Brand Identity

> **"An operational command system for the future of railway resilience."**  
> Blending **NASA Mission Control** + **Railway Operations Control Centre (OCC)** + **Premium AI Decision Platform**.

RailPulse-X presents a high-density, real-time, precision-engineered control room for dispatchers and transit authorities. It visually demonstrates the transition from passive point ETA prediction to an **active, uncertainty-aware counterfactual intervention engine**.

---

## 2. Design Tokens & Color Semantics

| Token | Hex Value | Semantic Usage |
| :--- | :--- | :--- |
| `--rp-bg-deep` | `#070A13` | Root application canvas, viewport backdrop |
| `--rp-bg-panel` | `#0E1424` | Primary control-room panels & card containers |
| `--rp-bg-card` | `#162036` | Nested widgets, table headers, elevated cards |
| `--rp-border-subtle` | `#1E2D4A` | Default panel borders, subtle gridlines |
| `--rp-border-active` | `#38BDF8` | Focused components, active scenario borders |
| `--rp-cyan-electric` | `#06B6D4` | Primary intelligence accent, conformal bounds, live track |
| `--rp-cyan-glow` | `#22D3EE` | Headway clearance, normal route paths, active telemetry |
| `--rp-emerald-action`| `#10B981` | Optimal CP-SAT recommendation, verified reforecast, on-time |
| `--rp-amber-warning` | `#F59E0B` | Minor delay (5–15m), headway risk, weather warnings |
| `--rp-red-disruption`| `#EF4444` | Injected disruption (>15m), platform conflicts, critical cascade |
| `--rp-text-primary`  | `#F8FAFC` | High-contrast data figures, primary headings, KPIs |
| `--rp-text-secondary`| `#94A3B8` | Subtitles, parameter values, table labels |
| `--rp-text-muted`    | `#64748B` | Micro-labels, unit descriptors, inactive state indicators |

---

## 3. Typography & Numerical Hierarchy

- **Font Family**:
  - Technical Sans: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  - Monospace / Tabular Figures: `'JetBrains Mono', 'Fira Code', 'Roboto Mono', Menlo, Consolas, monospace`
- **Micro-Labels**:
  - `font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--rp-text-muted);`
- **Display Figures (KPIs)**:
  - `font-family: monospace; font-size: 28px; font-weight: 800; font-variant-numeric: tabular-nums;`

Example Pattern:
```text
NETWORK DISRUPTION J(a)
36.20 pts  →  9.15 pts  [-74.7%]
```

---

## 4. Layout Architecture (1920×1080 Zero-Scroll Target)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TOP COMMAND BAR: RailPulse-X Wordmark | System Clock | Live Replay | Model & WS Status │
├───────────────┬────────────────────────────────────────────────────────┬───────────────┤
│ LEFT NAV      │ CENTER VIEWPORT (3D / 2D TOGGLE)                       │ RIGHT INTEL   │
│ - Network     │                                                        │ PANEL         │
│ - Trains      │   3D Three.js / React Three Fiber Railway Network       │ - Conformal   │
│ - Cascade     │   OR 2D Precision Leaflet Operational Map              │   ETA Ribbon  │
│ - What-If     │                                                        │ - Weather     │
│ - Decision    │   [Layers: Tracks, Stations, Risk, Cascade, Conflicts] │   Impact      │
│ - Reforecast  │                                                        │ - Disruption  │
│ - Benchmarks  │   [Camera Controls: Focus Train | Focus Cascade | Reset│   Scorer J(a) │
├───────────────┴────────────────────────────────────────────────────────┴───────────────┤
│ BOTTOM TIMELINE: Replay Controller (0.5x–10x) | Live WebSocket Telemetry Event Stream  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. 3D Visualization Rules (Three.js / React Three Fiber)

1. **Stations**: Data-driven glowing 3D nodes rendered at real geospatial coordinates with height proportional to betweenness centrality and color mapped to delay index.
2. **Trains**: Dynamic 3D markers with real-time velocity and positional interpolation along route segments.
3. **Routes**: Curved 3D spline lines with multi-state glow (Past = Dim, Current = Cyan, Disrupted Future = Red, Recommended Alternative = Emerald).
4. **Disruption Shockwave**: Pulsing radial energy rings propagating through network topology when delays are injected.
5. **Platform Resource Markers**: Station-adjacent track cylinders indicating track block occupancy and platform clearance windows.

---

## 6. Motion & Interactive Feedback Principles

- **State Transitions**: `transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);`
- **Pulsing Hazards**: Subtle 2s breathing animation on disrupted nodes (`box-shadow: 0 0 16px rgba(239, 68, 68, 0.45)`).
- **Recommendation Reveal**: Smooth height expansion and border luminance intensification upon CP-SAT solve completion.
- **Dynamic Number Tweening**: Disruption scores and ETA minutes transition smoothly between before and after states.
- **Jury Safety**: Deterministic replay state ensures 100% reproducible live demonstration without hardcoded values.
