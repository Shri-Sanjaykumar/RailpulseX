# RailPulse-X — Runbook & Execution Guide
## SIH 2026 | Problem Statement 26028

---

## 1. Quick Start

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Run End-to-End Pipeline
```bash
python scripts/run_all.py
```
This automatically executes:
1. **Dataset Audit**: Validates raw timetable and aggregated delay statistics.
2. **Preprocessing**: Constructs synthetic event logs (labeled `SYNTHETIC_PROXY`) with strict chronological 70/10/20 train/calibration/test split and zero leakage.
3. **Baseline Training**: Fits 4 naive baselines + Quantile LightGBM (P10/P50/P90).
4. **Proposed Model Training**: Trains GATv2 Event-Graph + Residual LightGBM Stacker with pinball loss.
5. **Model Evaluation & Comparison**: Evaluates both models on identical 20% test set, measuring MAE, RMSE, Pinball Loss, Empirical Coverage, and Interval Width.
6. **End-to-End Demo**: Injects +15 min disruption, simulates 7 counterfactuals, runs simulation-derived causal DML estimation, solves risk-sensitive optimization via CP-SAT, and verifies avoided disruption via reforecasting.

### Step 3: Run Interactive E2E Demo Standalone
```bash
python scripts/run_e2e_demo.py
```

### Step 4: Launch FastAPI Backend Server
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation available at: `http://localhost:8000/docs`

### Step 5: Launch React Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
Dashboard available at: `http://localhost:3000`

---

## 2. Architecture & Data Lineage

- **Backbone Schedule**: `schedules.json` (417,080 rows — REAL)
- **Delay Distributions**: `etrain_delays.csv` (1,900 rows — REAL)
- **Station Coordinates**: `stations.json` (8,697 points — REAL)
- **Event Log**: Synthesized from empirical lognormal distributions anchored to historical statistics. Labeled `SYNTHETIC_PROXY`.
- **Causal Module**: Double Machine Learning (`LinearDML` / EconML) over network confounders (betweenness, degree, track occupancy). Explicitly labeled `SIMULATION_DERIVED_CAUSAL_ESTIMATION`.
- **Optimization**: Google OR-Tools CP-SAT with CVaR surrogate buffer (P90 conformal tail risk penalty).

---

## 3. Automated Test Suite

Run full automated tests across data, models, graph, optimization, and reforecasting:
```bash
pytest tests/test_pipeline.py -v
```
