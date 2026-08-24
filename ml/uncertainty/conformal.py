"""
RailPulse-X — Conformal Calibration (MAPIE CQR)
Applies Conformalized Quantile Regression on calibration set.

Target: 90% empirical coverage (measured and reported).
We do NOT guarantee coverage — we target and measure it.
Ref: Romano et al. 2019/2023 (CQR); MAPIE team 2023-2025.
"""
import json
import sys
import pickle
import warnings
import numpy as np
import pandas as pd
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

warnings.filterwarnings("ignore")

BASE = Path(__file__).parent.parent.parent
sys.path.insert(0, str(BASE))

PROCESSED = BASE / "data" / "processed"
MODEL_DIR_BASELINE = BASE / "models" / "baseline"
MODEL_DIR_PROPOSED = BASE / "models" / "railpulse_x"
REPORT_DIR = BASE / "reports"

try:
    from mapie.regression import MapieQuantileRegressor
    HAS_MAPIE = True
except ImportError:
    HAS_MAPIE = False
    print("[WARN] mapie not available — using manual split conformal")


FEATURE_COLS = [
    "stop_index", "stops_remaining", "total_stops",
    "distance_from_origin_km", "distance_to_destination_km", "route_progress",
    "scheduled_dwell_minutes",
    "scheduled_arrival_hour", "scheduled_arrival_sin", "scheduled_arrival_cos",
    "day_of_week", "day_of_week_sin", "day_of_week_cos",
    "month", "month_sin", "month_cos",
    "is_peak_hour",
    "historical_mean_delay", "historical_p90_delay",
    "pct_right_time", "pct_significant_delay",
    "train_priority", "zone_encoded",
    "prev_delay_1", "prev_delay_2", "rolling_delay_3",
    "station_degree", "station_betweenness",
    "upstream_delay_1hop", "upstream_delay_2hop",
    "headway_margin_minutes", "platform_conflict_score",
    "track_occupancy_proxy",
]
TARGET = "delay_minutes"
ALPHA = 0.10  # target 90% coverage


def split_conformal_calibration(p10_calib, p90_calib, y_calib):
    """
    Manual split conformal calibration (CQR-style).
    Nonconformity score: max(q_lo(x) - y, y - q_hi(x))
    Calibrated correction Q ensures target coverage.
    
    Note: This targets 90% empirical coverage.
    Actual measured coverage is reported on test set.
    """
    scores = np.maximum(p10_calib - y_calib, y_calib - p90_calib)
    n = len(scores)
    q_level = np.ceil((1 - ALPHA) * (n + 1)) / n
    q_correction = float(np.quantile(scores, min(q_level, 1.0), method="higher"))
    return q_correction


def apply_conformal(p10, p90, correction):
    """Apply calibrated correction to widen intervals."""
    return p10 - correction, p90 + correction


def measure_coverage(y_true, lower, upper):
    covered = (lower <= y_true) & (y_true <= upper)
    coverage = float(np.mean(covered))
    width = float(np.mean(upper - lower))
    return coverage, width


def calibrate_baseline(calib_df, test_df):
    """Calibrate the baseline LightGBM model intervals."""
    print("[1/3] Calibrating baseline model intervals...")

    feat_cols = [c for c in FEATURE_COLS if c in calib_df.columns]

    with open(MODEL_DIR_BASELINE / "lgbm_p10.pkl", "rb") as f:
        m_p10 = pickle.load(f)
    with open(MODEL_DIR_BASELINE / "lgbm_p90.pkl", "rb") as f:
        m_p90 = pickle.load(f)

    X_calib = calib_df[feat_cols].fillna(0)
    y_calib = calib_df[TARGET].clip(0, 600).values
    X_test = test_df[feat_cols].fillna(0)
    y_test = test_df[TARGET].clip(0, 600).values

    p10_calib = m_p10.predict(X_calib).clip(0, 600)
    p90_calib = m_p90.predict(X_calib).clip(0, 600)
    p10_test = m_p10.predict(X_test).clip(0, 600)
    p90_test = m_p90.predict(X_test).clip(0, 600)

    # Pre-calibration
    pre_cov, pre_width = measure_coverage(y_test, p10_test, p90_test)
    print(f"   Pre-calibration: coverage={pre_cov:.1%}, width={pre_width:.2f} min")

    # Conformal calibration
    correction = split_conformal_calibration(p10_calib, p90_calib, y_calib)
    lower_cal, upper_cal = apply_conformal(p10_test, p90_test, correction)
    post_cov, post_width = measure_coverage(y_test, lower_cal, upper_cal)

    print(f"   Post-calibration: coverage={post_cov:.1%}, width={post_width:.2f} min (target: 90%)")
    print(f"   Correction applied: {correction:.3f} minutes")

    result = {
        "model": "Baseline_CQR",
        "pre_coverage": round(pre_cov, 4),
        "post_coverage": round(post_cov, 4),
        "pre_width": round(pre_width, 4),
        "post_width": round(post_width, 4),
        "correction": round(correction, 4),
        "target_coverage": 1 - ALPHA,
        "note": "Coverage is measured empirically on held-out test period. Target is 90%.",
    }

    # Save calibrated bounds
    np.save(MODEL_DIR_BASELINE / "conformal_lower.npy", lower_cal)
    np.save(MODEL_DIR_BASELINE / "conformal_upper.npy", upper_cal)
    np.save(MODEL_DIR_BASELINE / "conformal_correction.npy", np.array([correction]))

    return result


def calibrate_proposed(calib_df, test_df):
    """Calibrate the proposed GATv2 + LightGBM model intervals."""
    print("[2/3] Calibrating proposed model intervals...")

    feat_cols = [c for c in FEATURE_COLS if c in calib_df.columns]

    # Load stacker models
    with open(MODEL_DIR_PROPOSED / "stacker_p10.pkl", "rb") as f:
        s_p10 = pickle.load(f)
    with open(MODEL_DIR_PROPOSED / "stacker_p90.pkl", "rb") as f:
        s_p90 = pickle.load(f)

    # Load saved test augmented features
    X_test_aug = np.load(MODEL_DIR_PROPOSED / "X_test_aug.npy")
    y_test = np.load(MODEL_DIR_PROPOSED / "y_test.npy")

    # For calibration set: extract embeddings using GATv2
    import torch
    from scripts.train_railpulse import RailPulseGATv2, extract_embeddings, HAS_PYG

    with open(MODEL_DIR_PROPOSED / "feat_cols.json") as f:
        feat_cols_used = json.load(f)

    in_features = len(feat_cols_used)
    model = RailPulseGATv2(in_features, 64, 4)
    model.load_state_dict(torch.load(MODEL_DIR_PROPOSED / "gatv2_state.pt", map_location="cpu"))
    model.eval()

    calib_emb, calib_gat_preds = extract_embeddings(model, calib_df, feat_cols_used)
    X_calib_tab = calib_df[feat_cols_used].fillna(0).values
    X_calib_aug = np.hstack([X_calib_tab, calib_emb, calib_gat_preds])
    y_calib = calib_df[TARGET].clip(0, 600).values

    p10_calib = s_p10.predict(X_calib_aug).clip(0, 600)
    p90_calib = s_p90.predict(X_calib_aug).clip(0, 600)
    p10_test = s_p10.predict(X_test_aug).clip(0, 600)
    p90_test = s_p90.predict(X_test_aug).clip(0, 600)

    # Pre-calibration
    pre_cov, pre_width = measure_coverage(y_test, p10_test, p90_test)
    print(f"   Pre-calibration: coverage={pre_cov:.1%}, width={pre_width:.2f} min")

    # Conformal calibration
    correction = split_conformal_calibration(p10_calib, p90_calib, y_calib)
    lower_cal, upper_cal = apply_conformal(p10_test, p90_test, correction)
    post_cov, post_width = measure_coverage(y_test, lower_cal, upper_cal)

    print(f"   Post-calibration: coverage={post_cov:.1%}, width={post_width:.2f} min (target: 90%)")

    result = {
        "model": "Proposed_CQR",
        "pre_coverage": round(pre_cov, 4),
        "post_coverage": round(post_cov, 4),
        "pre_width": round(pre_width, 4),
        "post_width": round(post_width, 4),
        "correction": round(correction, 4),
        "target_coverage": 1 - ALPHA,
        "note": "Coverage is measured empirically on held-out test period. Target is 90%.",
    }

    np.save(MODEL_DIR_PROPOSED / "conformal_lower.npy", lower_cal)
    np.save(MODEL_DIR_PROPOSED / "conformal_upper.npy", upper_cal)
    np.save(MODEL_DIR_PROPOSED / "conformal_correction.npy", np.array([correction]))

    return result


def main():
    print("=" * 60)
    print("RAILPULSE-X CONFORMAL CALIBRATION (CQR)")
    print(f"Target coverage: {(1-ALPHA)*100:.0f}% (empirically measured)")
    print("=" * 60)

    calib_df = pd.read_parquet(PROCESSED / "calibration.parquet")
    test_df = pd.read_parquet(PROCESSED / "test.parquet")

    results = []

    try:
        r_baseline = calibrate_baseline(calib_df, test_df)
        results.append(r_baseline)
    except Exception as e:
        print(f"   [WARN] Baseline calibration failed: {e}")

    try:
        r_proposed = calibrate_proposed(calib_df, test_df)
        results.append(r_proposed)
    except Exception as e:
        print(f"   [WARN] Proposed calibration failed: {e}")

    print("\n[3/3] Saving conformal results...")
    with open(REPORT_DIR / "conformal_results.json", "w") as f:
        json.dump(results, f, indent=2)

    print("\nCONFORMAL CALIBRATION COMPLETE")
    for r in results:
        print(f"  {r['model']}: pre={r['pre_coverage']:.1%} → post={r['post_coverage']:.1%} (target=90%)")


if __name__ == "__main__":
    main()
