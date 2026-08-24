# RailPulse-X — Architecture Specification

## 1. Multi-Layer Functional Stack

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DATA INGESTION & AUDIT LAYER                             │
│    - Timetable Backbone (417k records from schedules.json)  │
│    - Aggregated Statistics (1.9k train/station delay stats) │
│    - Synthetic Event Generator (1.075M events, labeled)     │
│    - Chronological 70/10/20 Temporal Split Engine           │
└──────────────────────────────┬──────────────────────────────┘
                               │ Clean Parquet Datasets
┌──────────────────────────────▼──────────────────────────────┐
│ 2. ML FORECASTING & UNCERTAINTY LAYER                       │
│    - Baseline: LightGBM Quantile (P10/P50/P90)              │
│    - Proposed: PyTorch Geometric GATv2 Event Graph          │
│    - Stacking: Residual LightGBM Booster on 64-dim embeddings│
│    - Uncertainty: Split Conformal CQR (Target: 90% Coverage)│
└──────────────────────────────┬──────────────────────────────┘
                               │ ETA Distributions [P10, P50, P90]
┌──────────────────────────────▼──────────────────────────────┐
│ 3. NETWORK PROPAGATION & IMPACT LAYER                       │
│    - Dynamic Directed Event Graph G(t) in NetworkX          │
│    - BFS Cascade Propagation with Decay & Horizon           │
│    - Multi-Attribute Impact Cost Model J(a)                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Affected Network Topology
┌──────────────────────────────▼──────────────────────────────┐
│ 4. PRESCRIPTIVE INTERVENTION & OPTIMIZATION LAYER           │
│    - 7-Scenario Independent Counterfactual Simulator        │
│    - Simulation-Derived Causal Effect Estimation (DML)      │
│    - Risk-Sensitive Google OR-Tools CP-SAT Optimizer        │
│    - Hard Physical Constraints: Headway, Dwell, No-Overlap  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Optimal Feasible Action
┌──────────────────────────────▼──────────────────────────────┐
│ 5. CLOSED-LOOP REFORECAST & DELIVERY LAYER                  │
│    - State Mutation & Secondary ETA Inference Pass          │
│    - Disruption Avoidance Verification Delta J              │
│    - FastAPI REST & WebSocket Streaming API                 │
│    - React + TypeScript + Leaflet + Recharts Dashboard      │
└─────────────────────────────────────────────────────────────┘
```

## 2. Component Integration Matrix

| Source Stage | Output Data | Consuming Stage | Interface Contract |
| :--- | :--- | :--- | :--- |
| **GATv2 Graph Encoder** | 64-dim Node Embeddings | Residual LightGBM Stacker | Feature concatenation vector |
| **Quantile Forecasters** | Raw P10/P50/P90 Quantiles | Conformal Uncertainty Engine | Nonconformity score $s_i = \max(q_{10}-y, y-q_{90})$ |
| **Conformal Engine** | Calibrated P90 Bound | Impact Engine & CP-SAT | CVaR surrogate tail penalty $\lambda \cdot P_{90}$ |
| **NetworkX Graph** | Downstream Cascade Path | Counterfactual Simulator | Subgraph node set & conflict list |
| **Counterfactual Simulator**| 7 Scenario Impact Vectors | Causal DML & CP-SAT Solver | $J(a)$, effective delay, feasibility |
| **CP-SAT Optimizer** | Recommended Action | Closed-Loop Reforecast | Action configuration dict |
| **Reforecast Engine** | Avoided Disruption $\Delta J$ | FastAPI & React Dashboard | Canonical JSON payload |
