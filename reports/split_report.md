# Split Report

Generated: 2026-08-25T00:36:54.247075

## Method
Strictly chronological split. Data sorted by event timestamp.
No random shuffling. No row duplication across splits.

## Split
| Set | Rows | Start | End |
|---|---|---|---|
| Train (70%) | 752,808 | 2024-06-01 00:00:00 | 2024-07-12 23:59:00 |
| Calibration (10%) | 107,544 | 2024-07-13 00:00:00 | 2024-07-18 23:59:00 |
| Test (20%) | 215,088 | 2024-07-19 00:00:00 | 2024-07-30 23:59:00 |

## Leakage Checks
- [x] No timestamp overlap between Train and Calibration
- [x] No timestamp overlap between Calibration and Test
- [x] Scaler/encoder fitted only on train split
- [x] All future-based features excluded
- [x] All splits use same target definition

**RESULT: PASS**