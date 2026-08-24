"""
RailPulse-X — Model Comparison Report
Compares Baseline vs Proposed on the same final 20% chronological test set.
Produces: reports/model_comparison.json + reports/model_comparison.md

This is the central evidence for the jury:
  MODEL A (Baseline): LightGBM Quantile
  MODEL B (Proposed): GATv2 + LightGBM + CQR
  Same test set. Same disruption scenarios.
"""
import json
import sys
import warnings
import numpy as np
import pandas as pd
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

warnings.filterwarnings("ignore")

BASE = Path(__file__).parent.parent
sys.path.insert(0, str(BASE))

PROCESSED = BASE / "data" / "processed"
REPORT_DIR = BASE / "reports"
MODEL_BASELINE = BASE / "models" / "baseline"
MODEL_PROPOSED = BASE / "models" / "railpulse_x"


def load_results() -> dict:
    """Load saved evaluation results."""
    results = {}

    # Baseline results
    baseline_path = REPORT_DIR / "baseline_results.json"
    if baseline_path.exists():
        with open(baseline_path) as f:
            raw = json.load(f)
        for r in raw:
            if r.get("model") == "LightGBM_Baseline":
                results["baseline"] = r

    # Proposed results
    proposed_path = REPORT_DIR / "proposed_results.json"
    if proposed_path.exists():
        with open(proposed_path) as f:
            results["proposed"] = json.load(f)

    # Conformal results
    conformal_path = REPORT_DIR / "conformal_results.json"
    if conformal_path.exists():
        with open(conformal_path) as f:
            results["conformal"] = json.load(f)

    return results


def compute_improvement(baseline: dict, proposed: dict) -> dict:
    """Compute relative improvement of proposed over baseline."""
    improvements = {}
    for metric in ["MAE", "RMSE", "MedianAE", "PinballLoss_avg"]:
        b = baseline.get(metric, 1.0)
        p = proposed.get(metric, 1.0)
        if b > 0:
            improvements[f"{metric}_improvement_pct"] = round((b - p) / b * 100, 2)

    return improvements


def generate_comparison_report(results: dict) -> str:
    """Generate markdown comparison report."""
    baseline = results.get("baseline", {})
    proposed = results.get("proposed", {})
    conformal = results.get("conformal", [])
    improvements = compute_improvement(baseline, proposed) if baseline and proposed else {}

    lines = [
        "# RailPulse-X — Model Comparison Report",
        f"\n## Evaluation Protocol",
        "- **Split**: Strictly chronological 70% train / 10% calibration / 20% test",
        "- **Test set**: Final 20% of chronological data (never seen during training)",
        "- **Same test set**: Both Baseline and Proposed evaluated on identical data",
        "- **No leakage**: Scaler/encoder fitted only on training split",
        "",
        "## Point Prediction Metrics (P50 vs Ground Truth)\n",
        "| Metric | Baseline LightGBM | RailPulse-X GATv2+LightGBM | Improvement |",
        "|---|---|---|---|",
    ]

    for metric in ["MAE", "RMSE", "MedianAE"]:
        b_val = baseline.get(metric, "N/A")
        p_val = proposed.get(metric, "N/A")
        imp = improvements.get(f"{metric}_improvement_pct", "N/A")
        b_str = f"{b_val:.4f}" if isinstance(b_val, float) else str(b_val)
        p_str = f"{p_val:.4f}" if isinstance(p_val, float) else str(p_val)
        imp_str = f"**{imp:+.1f}%**" if isinstance(imp, float) else str(imp)
        lines.append(f"| {metric} (min) | {b_str} | {p_str} | {imp_str} |")

    lines += [
        "",
        "## Probabilistic Metrics (Interval Quality)\n",
        "| Metric | Baseline | Proposed | Target |",
        "|---|---|---|---|",
    ]

    for m_name, b_key, p_key in [
        ("Pinball Loss (avg)", "PinballLoss_avg", "PinballLoss_avg"),
        ("Coverage P10-P90 (pre-conformal)", "Coverage_P10_P90", "Coverage_P10_P90"),
        ("Interval Width (min)", "IntervalWidth_P10_P90", "IntervalWidth_P10_P90"),
    ]:
        b_val = baseline.get(b_key, "N/A")
        p_val = proposed.get(p_key, "N/A")
        b_str = f"{b_val:.4f}" if isinstance(b_val, float) else str(b_val)
        p_str = f"{p_val:.4f}" if isinstance(p_val, float) else str(p_val)
        lines.append(f"| {m_name} | {b_str} | {p_str} | - |")

    lines += [
        "",
        "## Conformal Calibration (CQR)\n",
        "| Model | Pre-calibration Coverage | Post-calibration Coverage | Target |",
        "|---|---|---|---|",
    ]
    for r in conformal:
        pre = r.get("pre_coverage", "N/A")
        post = r.get("post_coverage", "N/A")
        pre_str = f"{pre:.1%}" if isinstance(pre, float) else str(pre)
        post_str = f"{post:.1%}" if isinstance(post, float) else str(post)
        lines.append(f"| {r.get('model', '?')} | {pre_str} | {post_str} | 90% |")

    lines += [
        "",
        "> **Note**: Coverage is measured empirically on the held-out test period.",
        "> We target 90% and report measured coverage. Conformal calibration guarantees coverage",
        "> under exchangeability assumptions on the calibration set.",
        "",
        "## System-Level Metrics (+15 min Disruption Demo)\n",
        "These metrics assess the end-to-end pipeline, not just the ML model.\n",
        "| Metric | No Intervention | RailPulse-X Best Action |",
        "|---|---|---|",
        "| Expected disruption J(a) | J(no_action) | J(best) |",
        "| P90 tail disruption | baseline_P90 | reduced_P90 |",
        "| Avoided weighted disruption | - | J(no_action) - J(best) |",
        "| Improvement % | - | (J(no_action) - J(best)) / J(no_action) × 100 |",
        "",
        "> Run `python scripts/run_e2e_demo.py` to populate these values with actual numbers.",
        "",
        "## Jury-Facing Summary",
        "",
        "RailPulse-X proposes an uncertainty-aware counterfactual intervention engine",
        "that transforms train-level ETA distributions into network-level disruption",
        "distributions, estimates the differential impact of feasible interventions within",
        "a controlled railway simulation environment, performs risk-sensitive constrained",
        "optimization, and verifies the selected intervention through closed-loop reforecasting.",
        "",
        "Our literature review did not identify a published system that integrates these stages",
        "into a single operational prototype for Indian Railway data.",
    ]

    return "\n".join(lines)


def main():
    print("=" * 60)
    print("RAILPULSE-X MODEL COMPARISON")
    print("=" * 60)

    results = load_results()

    if not results:
        print("[WARN] No results found. Run train_baseline.py and train_railpulse.py first.")
        # Generate skeleton report
        results = {
            "baseline": {"model": "LightGBM_Baseline", "MAE": "pending", "RMSE": "pending",
                         "MedianAE": "pending", "PinballLoss_avg": "pending",
                         "Coverage_P10_P90": "pending", "IntervalWidth_P10_P90": "pending"},
            "proposed": {"model": "RailPulseX", "MAE": "pending", "RMSE": "pending",
                         "MedianAE": "pending", "PinballLoss_avg": "pending",
                         "Coverage_P10_P90": "pending", "IntervalWidth_P10_P90": "pending"},
            "conformal": [],
        }

    improvements = compute_improvement(results.get("baseline", {}), results.get("proposed", {}))
    combined = {**results, "improvements": improvements}

    with open(REPORT_DIR / "model_comparison.json", "w") as f:
        json.dump(combined, f, indent=2, default=str)

    report_md = generate_comparison_report(results)
    (REPORT_DIR / "model_comparison.md").write_text(report_md, encoding="utf-8")

    print(f"\nComparison report saved: {REPORT_DIR / 'model_comparison.md'}")
    print(f"Comparison JSON saved:  {REPORT_DIR / 'model_comparison.json'}")

    # Print key improvements
    if improvements:
        print("\nKey Improvements (Proposed over Baseline):")
        for k, v in improvements.items():
            print(f"  {k}: {v:+.2f}%")


if __name__ == "__main__":
    main()
