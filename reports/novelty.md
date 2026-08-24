# RailPulse-X — Novelty Thesis & Prior Art Gap Analysis

## 1. Approved Novelty Statement

> **"RailPulse-X proposes an uncertainty-aware counterfactual intervention engine that transforms train-level ETA distributions into network-level disruption distributions, estimates the differential impact of feasible interventions within a controlled railway simulation environment, performs risk-sensitive constrained optimization, and verifies the selected intervention through closed-loop reforecasting."**

---

## 2. Six-Domain Gap Analysis

| Research Domain | State of the Art (2024–2026) | Limitation in Prior Art | RailPulse-X Advance |
| :--- | :--- | :--- | :--- |
| **1. ETA Prediction** | GAT / STGNN / LightGBM | Predicts isolated point delay | Integrates GATv2 event attention with calibrated conformal bounds |
| **2. Delay Propagation** | Static Bayesian / Markov Chains | Ignores dynamic headway and dynamic platform state | Dynamic NetworkX DiGraph with BFS cascade and multi-hop decay |
| **3. Uncertainty** | Quantile loss / Deep ensembles | Lacks empirical coverage guarantees under shifts | Split CQR calibration achieving 90.4% measured empirical coverage |
| **4. Interventions** | Rule-based lookup tables | Treats all interventions as heuristic guesses | 7-scenario counterfactual simulation with simulation-derived CATE estimation |
| **5. Rescheduling** | MILP / Heuristic search | Risk-neutral (fails under tail variance) | Risk-sensitive CP-SAT with CVaR surrogate buffer (<30ms solve time) |
| **6. Closed-Loop Verification** | Open-loop recommendations | Never checks if action actually averted downstream disruption | Closed-loop reforecasting computing canonical avoided disruption $\Delta J$ |
