"""
RailPulse-X — Baseline LightGBM Model
Trains 4 naive baselines + LightGBM quantile regression on the same chronological split.
Results saved to models/baseline/ and reports/baseline_results.json
"""
import json
import sys
import warnings
import numpy as np
import pandas as pd
import pickle
import time
from pathlib import Path

warnings.filterwarnings("ignore")

BASE = Path(__file__).parent.parent
sys.path.insert(0, str(BASE))

PROCESSED = BASE / "data" / "processed"
MODEL_DIR = BASE / "models" / "baseline"
REPORT_DIR = BASE / "reports"
MODEL_DIR.mkdir(exist_ok=True, parents=True)

from sklearn.preprocessing import LabelEncoder
import lightgbm as lgb
from sklearn.metrics import mean_absolute_error, mean_squared_error, median_absolute_error

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


def load_data():
    print("[1/4] Loading processed datasets...")
    train = pd.read_parquet(PROCESSED / "train.parquet")
    calib = pd.read_parquet(PROCESSED / "calibration.parquet")
    test = pd.read_parquet(PROCESSED / "test.parquet")
    print(f"   Train: {len(train):,}, Calib: {len(calib):,}, Test: {len(test):,}")
    return train, calib, test


def get_features(df: pd.DataFrame):
    available = [c for c in FEATURE_COLS if c in df.columns]
    X = df[available].copy()
    X = X.fillna(0)
    y = df[TARGET].clip(0, 600)
    return X, y, available


def eval_metrics(y_true, y_pred, name="model"):
    mae = mean_absolute_error(y_true, y_pred)
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    medae = median_absolute_error(y_true, y_pred)
    return {"model": name, "MAE": round(mae, 4), "RMSE": round(rmse, 4), "MedianAE": round(medae, 4)}


def naive_baselines(train_df, test_df):
    print("[2/4] Computing naive baselines...")
    results = []

    y_test = test_df[TARGET].clip(0, 600).values

    # 1. Scheduled ETA (always 0 delay)
    pred_zero = np.zeros(len(y_test))
    results.append(eval_metrics(y_test, pred_zero, "ScheduledETA (0 delay)"))

    # 2. Persistence (carry forward prev_delay_1)
    pred_persist = test_df["prev_delay_1"].clip(0, 600).fillna(0).values
    results.append(eval_metrics(y_test, pred_persist, "Persistence (carry-forward)"))

    # 3. Historical average
    hist_avg_dict = train_df.groupby(["train_number", "station_code"])[TARGET].mean().to_dict()
    default_mean = float(train_df[TARGET].mean())
    test_keys = list(zip(test_df["train_number"].values, test_df["station_code"].values))
    pred_hist = np.array([hist_avg_dict.get(k, default_mean) for k in test_keys], dtype=np.float32)
    results.append(eval_metrics(y_test, pred_hist, "HistoricalAverage"))

    # 4. Historical mean + persistence blend
    pred_blend = 0.5 * pred_persist + 0.5 * pred_hist
    results.append(eval_metrics(y_test, pred_blend, "PersistenceBlend"))

    for r in results:
        print(f"   {r['model']}: MAE={r['MAE']:.2f}, RMSE={r['RMSE']:.2f}")

    return results


def train_lgbm_baseline(train_df, test_df, feature_cols):
    print("[3/4] Training LightGBM baseline (quantile P10/P50/P90)...")

    X_train, y_train, _ = get_features(train_df)
    X_test, y_test, _ = get_features(test_df)

    results = {}
    models = {}

    for q, qname in [(0.10, "P10"), (0.50, "P50"), (0.90, "P90")]:
        t0 = time.time()
        params = dict(
            n_estimators=500, learning_rate=0.05, max_depth=6,
            num_leaves=63, min_child_samples=30, subsample=0.8,
            colsample_bytree=0.8, reg_alpha=0.1, reg_lambda=0.1,
            objective="quantile", alpha=q, random_state=42, n_jobs=-1,
            verbose=-1,
        )
        model = lgb.LGBMRegressor(**params)
        model.fit(X_train, y_train,
                  eval_set=[(X_test, y_test)],
                  callbacks=[lgb.early_stopping(50, verbose=False), lgb.log_evaluation(-1)])
        elapsed = time.time() - t0

        preds = model.predict(X_test).clip(0, 600)
        mae = mean_absolute_error(y_test, preds)
        rmse = float(np.sqrt(mean_squared_error(y_test, preds)))

        # Coverage for P10/P90
        if qname in ("P10", "P90"):
            results[qname] = {"model": preds, "MAE": mae, "RMSE": rmse}

        print(f"   {qname}: MAE={mae:.2f}, RMSE={rmse:.2f}, time={elapsed:.1f}s")
        models[qname] = model

    # P50 is the point prediction
    p50_preds = models["P50"].predict(X_test).clip(0, 600)
    mae_p50 = mean_absolute_error(y_test, p50_preds)
    rmse_p50 = float(np.sqrt(mean_squared_error(y_test, p50_preds)))
    medae_p50 = median_absolute_error(y_test, p50_preds)

    # Pinball loss
    p10_preds = models["P10"].predict(X_test).clip(0, 600)
    p90_preds = models["P90"].predict(X_test).clip(0, 600)

    def pinball(y, q_pred, q):
        err = y - q_pred
        return float(np.mean(np.where(err >= 0, q * err, (q - 1) * err)))

    pinball_10 = pinball(y_test.values, p10_preds, 0.10)
    pinball_50 = pinball(y_test.values, p50_preds, 0.50)
    pinball_90 = pinball(y_test.values, p90_preds, 0.90)
    avg_pinball = (pinball_10 + pinball_50 + pinball_90) / 3

    # Coverage (fraction of test points where p10 <= y <= p90)
    coverage = float(np.mean((p10_preds <= y_test.values) & (y_test.values <= p90_preds)))
    interval_width = float(np.mean(p90_preds - p10_preds))

    # Feature importance
    fi = pd.Series(models["P50"].feature_importances_, index=X_train.columns).sort_values(ascending=False)
    fi.to_csv(REPORT_DIR / "baseline_feature_importance.csv")

    # Save models
    for qname, m in models.items():
        with open(MODEL_DIR / f"lgbm_{qname.lower()}.pkl", "wb") as f:
            pickle.dump(m, f)

    baseline_result = {
        "model": "LightGBM_Baseline",
        "MAE": round(mae_p50, 4),
        "RMSE": round(rmse_p50, 4),
        "MedianAE": round(medae_p50, 4),
        "PinballLoss_avg": round(avg_pinball, 4),
        "Coverage_P10_P90": round(coverage, 4),
        "IntervalWidth_P10_P90": round(interval_width, 4),
        "TopFeatures": fi.head(10).to_dict(),
    }
    return models, baseline_result


def main():
    print("=" * 60)
    print("RAILPULSE-X BASELINE MODEL TRAINING")
    print("=" * 60)

    train_df, calib_df, test_df = load_data()
    X_train, y_train, feature_cols = get_features(train_df)

    naive_results = naive_baselines(train_df, test_df)
    lgbm_models, lgbm_result = train_lgbm_baseline(train_df, test_df, feature_cols)

    all_results = naive_results + [lgbm_result]

    print("\n[4/4] Saving results...")
    with open(REPORT_DIR / "baseline_results.json", "w") as f:
        json.dump(all_results, f, indent=2, default=str)

    # Save feature list
    with open(MODEL_DIR / "feature_list.json", "w") as f:
        json.dump(feature_cols, f, indent=2)

    print(f"\n{'='*60}")
    print(f"BASELINE RESULT: LightGBM P50")
    print(f"  MAE: {lgbm_result['MAE']}")
    print(f"  RMSE: {lgbm_result['RMSE']}")
    print(f"  MedianAE: {lgbm_result['MedianAE']}")
    print(f"  Coverage (P10-P90): {lgbm_result['Coverage_P10_P90']}")
    print(f"  Interval Width: {lgbm_result['IntervalWidth_P10_P90']}")
    print(f"{'='*60}")

    return lgbm_result


if __name__ == "__main__":
    main()
