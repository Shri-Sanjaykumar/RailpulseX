"""
RailPulse-X — Master Run Script
Executes all phases in sequence and generates full report.

Usage:
  python scripts/run_all.py              # Full pipeline
  python scripts/run_all.py --demo-only  # Only E2E demo
  python scripts/run_all.py --skip-train # Skip model training
"""
import argparse
import subprocess
import sys
import time
from pathlib import Path

BASE = Path(__file__).parent.parent


def run_step(name: str, script: str, args: list = None):
    print(f"\n{'='*70}")
    print(f"PHASE: {name}")
    print(f"{'='*70}")
    t0 = time.time()
    cmd = [sys.executable, str(BASE / "scripts" / script)] + (args or [])
    result = subprocess.run(cmd, cwd=str(BASE), capture_output=False)
    elapsed = time.time() - t0
    if result.returncode != 0:
        print(f"\n[ERROR] {name} failed (exit code {result.returncode})")
        return False
    print(f"\n[OK] {name} completed in {elapsed:.1f}s")
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--demo-only", action="store_true")
    parser.add_argument("--skip-train", action="store_true")
    args = parser.parse_args()

    start = time.time()

    if args.demo_only:
        run_step("E2E Demo", "run_e2e_demo.py")
        return

    # Phase 0: Audit
    run_step("Dataset Audit", "audit_dataset.py")

    if not args.skip_train:
        # Phase 1: Preprocess
        ok = run_step("Preprocessing + Synthetic Event Construction", "preprocess.py")
        if not ok:
            print("[ABORT] Preprocessing failed. Fix errors before continuing.")
            sys.exit(1)

        # Phase 2: Baseline
        run_step("Baseline LightGBM Training", "train_baseline.py")

        # Phase 3: Proposed Model
        run_step("GATv2 + LightGBM Proposed Model", "train_railpulse.py")

        # Phase 4: Conformal Calibration (CQR)
        run_step("Conformal Calibration (MAPIE CQR)", "../ml/uncertainty/conformal.py")

    # Phase 5: Model Comparison
    run_step("Model Comparison Report", "evaluate_models.py")

    # Phase 6: E2E Demo
    run_step("End-to-End Demo", "run_e2e_demo.py")

    elapsed = time.time() - start
    print(f"\n{'='*70}")
    print(f"ALL PHASES COMPLETE in {elapsed/60:.1f} minutes")
    print(f"{'='*70}")
    print(f"\nKey outputs:")
    print(f"  reports/dataset_audit.md")
    print(f"  reports/split_report.md")
    print(f"  reports/baseline_results.json")
    print(f"  reports/proposed_results.json")
    print(f"  reports/model_comparison.md")
    print(f"  reports/e2e_demo_results.json")
    print(f"\nTo start the API server:")
    print(f"  cd C:\\projects\\portfolio\\SIH\\railpulse-x")
    print(f"  python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload")


if __name__ == "__main__":
    main()
