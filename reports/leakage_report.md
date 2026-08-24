# RailPulse-X — Temporal Leakage Audit Report

## 1. Split Definition & Timeline

| Split | Percentage | Number of Rows | Start Date | End Date |
| :--- | :--- | :--- | :--- | :--- |
| **Train Split** | 70% | 752,808 | `2024-06-01 00:00:00` | `2024-07-12 23:59:00` |
| **Calibration Split** | 10% | 107,544 | `2024-07-13 00:00:00` | `2024-07-18 23:59:00` |
| **Final Test Split** | 20% | 215,088 | `2024-07-19 00:00:00` | `2024-07-30 23:59:00` |

---

## 2. Leakage Guard Checklist

- [x] **No Timestamp Overlap**: $\max(\text{Train}) \le \min(\text{Calib})$ and $\max(\text{Calib}) \le \min(\text{Test})$.
- [x] **Feature Encoders**: Fitted strictly on the Train split only.
- [x] **Lag Features**: Computed within trips using only preceding stop indices (`shift(1)`, `shift(2)`).
- [x] **Conformal Calibration**: Calibration quantile adjustment computed exclusively on the 10% calibration set.
- [x] **Zero Shuffling**: Chronological ordering enforced prior to split creation.

**AUDIT VERDICT: PASS (ZERO TEMPORAL LEAKAGE)**
