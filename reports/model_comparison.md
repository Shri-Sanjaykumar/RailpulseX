# RailPulse-X — Model Comparison Report

## Evaluation Protocol
- **Split**: Strictly chronological 70% train / 10% calibration / 20% test
- **Test set**: Final 20% of chronological data (never seen during training)
- **Same test set**: Both Baseline and Proposed evaluated on identical data
- **No leakage**: Scaler/encoder fitted only on training split

## Point Prediction Metrics (P50 vs Ground Truth)

| Metric | Baseline LightGBM | RailPulse-X GATv2+LightGBM | Improvement |
|---|---|---|---|
| MAE (min) | 1.8456 | 1.8453 | **+0.0%** |
| RMSE (min) | 3.5802 | 3.5340 | **+1.3%** |
| MedianAE (min) | 1.3531 | 1.3534 | **-0.0%** |

## Probabilistic Metrics (Interval Quality)

| Metric | Baseline | Proposed | Target |
|---|---|---|---|
| Pinball Loss (avg) | 0.5873 | 0.5873 | - |
| Coverage P10-P90 (pre-conformal) | 0.7991 | 0.7999 | - |
| Interval Width (min) | 5.8507 | 5.8683 | - |

## Conformal Calibration (CQR)

| Model | Pre-calibration Coverage | Post-calibration Coverage | Target |
|---|---|---|---|
| Baseline_CQR | 79.9% | 90.4% | 90% |
| Proposed_CQR | 80.0% | 90.4% | 90% |

> **Note**: Coverage is measured empirically on the held-out test period.
> We target 90% and report measured coverage. Conformal calibration guarantees coverage
> under exchangeability assumptions on the calibration set.

## System-Level Metrics (+15 min Disruption Demo)

These metrics assess the end-to-end pipeline, not just the ML model.

| Metric | No Intervention | RailPulse-X Best Action |
|---|---|---|
| Expected disruption J(a) | J(no_action) | J(best) |
| P90 tail disruption | baseline_P90 | reduced_P90 |
| Avoided weighted disruption | - | J(no_action) - J(best) |
| Improvement % | - | (J(no_action) - J(best)) / J(no_action) × 100 |

> Run `python scripts/run_e2e_demo.py` to populate these values with actual numbers.

## Jury-Facing Summary

RailPulse-X proposes an uncertainty-aware counterfactual intervention engine
that transforms train-level ETA distributions into network-level disruption
distributions, estimates the differential impact of feasible interventions within
a controlled railway simulation environment, performs risk-sensitive constrained
optimization, and verifies the selected intervention through closed-loop reforecasting.

Our literature review did not identify a published system that integrates these stages
into a single operational prototype for Indian Railway data.