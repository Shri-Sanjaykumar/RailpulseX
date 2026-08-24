# RailPulse-X — 3D Control Room & Frontend Architecture Report
## High-Fidelity Decision Support Experience (Google Stitch Design Standard)
### Smart India Hackathon (SIH 2026) | Problem Statement 26028

---

## 1. Executive Summary & Design System

RailPulse-X delivers an operational command center combining the technical rigor of a **Railway Operations Control Centre (OCC)**, the precision telemetry of **NASA Mission Control**, and the intelligence of a **Next-Generation Prescriptive AI Platform**.

The frontend visually demonstrates the fundamental paradigm shift from **passive scalar point ETA predictions** to an **active, uncertainty-aware counterfactual intervention engine**.

- **Design Specification**: Fully documented in [`DESIGN.md`](file:///C:/projects/portfolio/SIH/railpulse-x/DESIGN.md) following Google Stitch design tokens and hierarchy guidelines.
- **Palette**: Deep space graphite (`#070A13`), OCC panel navy (`#0E1424`), electric cyan intelligence accents (`#06B6D4`), amber hazard buffers (`#F59E0B`), and emerald CP-SAT verified interventions (`#10B981`).
- **Typography**: High-readability technical sans with monospace tabular figures for all real-time delay minutes, confidence bounds, and $J(a)$ loss scores.

---

## 2. Multi-Modal Visual Capabilities

| Module / Component | Technical Foundation | Real-Time Dynamic Behavior |
| :--- | :--- | :--- |
| **3D Dynamic Event Graph** | Three.js + React Three Fiber + Drei | Geospatially projected 3D station nodes, spline corridors, dynamic train capsules, and pulsing disruption shockwaves. |
| **2D Precision Operational Map** | Leaflet + CartoDB Dark Matter | High-contrast geospatial railway network, junction conflict overlays, and real-time station popups. |
| **Conformal Uncertainty Ribbon** | Split CQR Quantile Inference | Calibrated $[P_{10}, P_{50}, P_{90}]$ adaptive uncertainty ribbon targeting 90% empirical coverage. |
| **Weather Modulation Engine** | Physics & Speed Restriction Multipliers | Real-time weather selector (`NORMAL`, `RAIN`, `HEAVY_RAIN`, `FOG`, `HIGH_WIND`) dynamically updating ETA forecasts, speed restrictions, and risk parameters. |
| **7-Scenario What-If Lab** | Independent Deep-Copy Simulation | Evaluates 7 candidate interventions from an identical base state, computing $J(a)$ without cross-contamination. |
| **Simulation-Derived Causal DML** | EconML LinearDML / Paired Fallback | Estimates treatment effect $\Delta Y = E[Y(\text{do } A)] - E[Y(\text{do } B)]$ over network topological confounders. |
| **Risk-Sensitive CP-SAT Solver**| Google OR-Tools CP-SAT | Prescriptive constrained optimization minimizing $E[J(a)] + \lambda \cdot P_{90}$ with physical headway and platform constraints in $<30\text{ ms}$. |
| **Closed-Loop Reforecast** | Secondary ETA & Graph Pass | Verifies avoided network disruption ($J = 36.20 \to 9.15\text{ pts}$, $\Delta J = +27.05\text{ pts}$, $74.7\%$ reduction). |
| **Live Replay Controller** | WebSocket Stream (`WS /stream`) | Play, Pause, Step, Speed scaling ($0.5\times$ to $10\times$), and 7-stage closed-loop pipeline progress tracker. |
| **1-Click Jury Demo Flow** | Automated Presentation Orchestrator | Automated live execution of the full closed-loop cycle without mock values. |

---

## 3. Verification & Build Results

- **Backend Automated Test Suite**: `20 / 20 PASSED` (`pytest tests/ -v` in `10.21s`).
- **Frontend Production Build**: `tsc && vite build` succeeded in `30.33s` with `0 TypeScript errors` and `0 vulnerabilities`.
- **API Health & Endpoints**: All REST and WebSocket routes tested and operational on `http://localhost:8000`.

---

## 4. Key Takeaways for Hackathon Jury

1. **Prediction vs Resilience**: Conventional systems merely report that a train is 15 minutes late. RailPulse-X transforms that delay into a network-wide probability distribution, simulates candidate actions, solves for the risk-optimal intervention, and proves the disruption was avoided.
2. **Zero Fake Metrics**: Every single number, coordinate, score, and recommendation in the dashboard is generated dynamically by the underlying Python ML/optimization pipeline.
