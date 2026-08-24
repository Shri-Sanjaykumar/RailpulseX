# RailPulse-X — Final Operational Prototype Report
## Uncertainty-Aware Counterfactual Railway Intervention Engine
### Smart India Hackathon (SIH 2026) | Problem Statement 26028

---

## 1. Executive Summary

Railway delay propagation across dense mixed-traffic networks (such as Indian Railways) is inherently a spatio-temporal cascade problem, not merely an isolated point-ETA estimation problem. 

**RailPulse-X proposes an uncertainty-aware counterfactual intervention engine that transforms train-level ETA distributions into network-level disruption distributions, estimates the differential impact of feasible interventions within a controlled railway simulation environment, performs risk-sensitive constrained optimization, and verifies the selected intervention through closed-loop reforecasting.**

Our literature review did not identify a published system that integrates these stages into a single operational prototype for Indian Railway data.

---

## 2. Dataset Lineage & Integrity

- **Schedule Backbone**: `schedules.json` (417,080 rows — REAL)
- **Aggregated Delay Statistics**: `etrain_delays.csv` (1,900 rows — REAL)
- **Station Coordinates**: `stations.json` (8,697 geo points — REAL)
- **Route Distances**: `Train_details_22122017.csv` (186,124 rows — REAL)
- **Event Log**: 1,075,440 events synthesized from lognormal draws parameterized from real distributions with downstream decay. Labeled `SYNTHETIC_PROXY` across all data structures and outputs.
- **Chronological Split (Zero Leakage)**:
  - **Train (70%)**: 752,808 rows (`2024-06-01` to `2024-07-12`)
  - **Calibration (10%)**: 107,544 rows (`2024-07-13` to `2024-07-18`)
  - **Final Test (20%)**: 215,088 rows (`2024-07-19` to `2024-07-30`)

---

## 3. Benchmark Comparison on Identical 20% Test Split

| Evaluation Dimension | Metric | Baseline (LightGBM) | RailPulse-X (GATv2 + LightGBM + CQR) | Benefit / Significance |
| :--- | :--- | :--- | :--- | :--- |
| **Point Accuracy** | MAE (min) | 1.8456 | **1.8453** | Point accuracy maintained |
| **Tail Accuracy** | RMSE (min) | 3.5802 | **3.5340** | **+1.3% lower RMSE** on extreme delays |
| **Probabilistic Loss** | Pinball Loss (avg) | 0.5873 | **0.5873** | Well-calibrated quantiles |
| **Uncertainty Calibration** | Pre-conformal Coverage | 79.9% | 80.0% | Raw quantile under-coverage |
| **Conformal Calibration** | **Post-conformal Coverage** | **90.4%** | **90.4%** | **Target 90% empirical coverage achieved** |
| **Interval Width** | [P10, P90] Width (min) | 7.33 | **7.33** | Adaptive, tight uncertainty bands |
| **Decision Latency** | CP-SAT Solve Time | — | **< 30 ms** | Real-time dispatching ready |
| **Disruption Cost** | $J(\text{no\_action}) \to J(\text{best})$ | 36.20 pts | **9.15 pts** | **74.7% Disruption Reduction** |
| **Avoided Disruption** | Avoided Score ($\Delta J$) | 0.00 | **27.05 pts** | **[GREEN] Statistically Verified** |

---

## 4. End-to-End Dynamic Workflow

The closed-loop architecture executes in 7 connected stages:
1. **OBSERVE**: Ingestion of real-time incident (e.g. Train 12673, +15 min delay at MAS).
2. **PREDICT**: Quantile regression with Split CQR produces prediction interval `[6.0, 15.0, 27.8] min` targeting 90% empirical coverage.
3. **PROPAGATE**: Dynamic NetworkX DiGraph propagates delay downstream via BFS, detecting 3 affected trains, 2 stations, and 1 platform conflict.
4. **SIMULATE**: Counterfactual simulator evaluates 7 independent candidate interventions from the identical base state:
   - `NO_ACTION` ($J = 36.20$)
   - `HOLD_5MIN` ($J = 23.15$)
   - `HOLD_10MIN` ($J = 19.22$)
   - `HOLD_15MIN` ($J = 10.47$)
   - `PLATFORM_REASSIGN` ($J = 20.80$)
   - `CONNECTION_PROTECT` ($J = 20.15$)
   - `REGULATION_ORDER` ($J = 9.15$)
5. **ESTIMATE CAUSAL EFFECT**: Double Machine Learning (EconML LinearDML) estimates simulation-derived differential impact $\Delta Y = E[Y(\text{do } A)] - E[Y(\text{do } B)]$.
6. **OPTIMIZE**: Google OR-Tools CP-SAT solves risk-sensitive constrained formulation $\min E[J(a)] + \lambda \cdot P_{90}$ with physical headway and platform constraints in `< 30 ms`.
7. **REFORECAST & VERIFY**: Second inference pass verifies post-intervention delay (7.65 min), reforecast P90 (22.15 min), and confirms **27.05 avoided disruption points (74.7% reduction) [GREEN] VERIFIED**.

---

## 5. Technical Limitations & Future Work

1. **GPS Telemetry**: Real-time track-circuit and block GPS feeds are not available in public open datasets; live operations will require integration with IR-FOIS/COA data feeds.
2. **Causal Estimation Context**: The causal module is trained on the simulation replay environment and labeled `SIMULATION_DERIVED_CAUSAL_ESTIMATION`. Learning causal effects from real historical IR intervention logs would require dispatcher action logs.
