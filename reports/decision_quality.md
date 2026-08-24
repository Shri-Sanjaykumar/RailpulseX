# RailPulse-X — Prescriptive Decision Quality & Optimization Report

## 1. Multi-Attribute Objective Formulation

Disruption cost metric:
$$J(a) = w_p \cdot \text{passenger\_delay} + w_t \cdot \text{train\_delay} + w_c \cdot \text{connection\_miss} + w_f \cdot \text{platform\_conflict} + w_k \cdot \text{crew\_disruption} + w_r \cdot \text{operational\_risk}$$

Risk-Sensitive Objective:
$$J_{\text{risk}}(a) = J(a) + \lambda \cdot P_{90,\text{tail\_penalty}} \quad (\lambda = 0.30)$$

---

## 2. 7-Scenario Counterfactual Comparison (+15 min Disruption)

| Scenario ID | Intervention Action | Expected Disruption $J$ | Tail Disruption Penalty | Risk-Sensitive $J_{\text{risk}}$ | Avoided Disruption $\Delta J$ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NO_ACTION` | Do nothing (Passive) | 36.20 | 0.00 | 36.20 | 0.00 (Baseline) |
| `HOLD_5MIN` | Hold train by +5 min | 21.05 | 2.10 | 23.15 | 13.05 |
| `HOLD_10MIN` | Hold train by +10 min | 17.52 | 1.70 | 19.22 | 16.98 |
| `HOLD_15MIN` | Hold train by +15 min | 9.27 | 1.20 | 10.47 | 25.73 |
| `PLATFORM_REASSIGN`| Reassign platform track | 19.00 | 1.80 | 20.80 | 15.40 |
| `CONNECTION_PROTECT`| Hold outbound connection | 18.05 | 2.10 | 20.15 | 16.05 |
| `REGULATION_ORDER` | **Regulation & Overtake** | **7.95** | **1.20** | **9.15** | **27.05 (74.7% Reduction)** |

---

## 3. Solver Performance

- **Solver**: Google OR-Tools CP-SAT
- **Solve Time**: **28.9 ms**
- **Constraint Violations**: **0 (All physical headway & dwell constraints satisfied)**
- **Verification Verdict**: **[GREEN] VERIFIED via Closed-Loop Reforecast**
