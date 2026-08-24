"""
RailPulse-X — Dataset Audit Script
Audits all 5 source files and generates reports/dataset_audit.md
"""
import json
import csv
import os
import sys
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime

BASE = Path(__file__).parent.parent
REFER = Path("C:/Users/Priya/Downloads/REFER/RAILPULSE X")
REPORT_DIR = BASE / "reports"
REPORT_DIR.mkdir(exist_ok=True)


def audit_csv(path: Path, name: str) -> dict:
    print(f"\n[AUDIT] {name}")
    df = pd.read_csv(path, low_memory=False)
    info = {
        "name": name,
        "rows": len(df),
        "cols": len(df.columns),
        "columns": list(df.columns),
        "dtypes": {c: str(df[c].dtype) for c in df.columns},
        "missing_pct": {c: round(df[c].isnull().mean() * 100, 2) for c in df.columns},
        "duplicates": int(df.duplicated().sum()),
    }
    for c in df.columns:
        try:
            if df[c].nunique() < 20:
                info[f"unique_{c}"] = df[c].nunique()
        except Exception:
            pass
    print(f"  Rows: {info['rows']}, Cols: {info['cols']}")
    print(f"  Columns: {info['columns']}")
    print(f"  Missing %: {info['missing_pct']}")
    return info, df


def audit_json(path: Path, name: str) -> dict:
    print(f"\n[AUDIT] {name}")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, list):
        info = {
            "name": name,
            "type": "list",
            "records": len(data),
            "sample_keys": list(data[0].keys()) if data else [],
        }
        print(f"  Records: {info['records']}, Keys: {info['sample_keys']}")
    elif isinstance(data, dict) and "features" in data:
        feats = data["features"]
        info = {
            "name": name,
            "type": "geojson_featurecollection",
            "features": len(feats),
            "geometry_type": feats[0]["geometry"]["type"] if feats else "unknown",
            "sample_props": list(feats[0]["properties"].keys()) if feats else [],
        }
        print(f"  GeoJSON features: {info['features']}, Geom: {info['geometry_type']}")
        print(f"  Properties: {info['sample_props']}")
    return info


def main():
    print("=" * 60)
    print("RAILPULSE-X DATASET AUDIT")
    print(f"Time: {datetime.now().isoformat()}")
    print("=" * 60)

    audits = {}

    # 1. etrain_delays.csv
    delays_info, delays_df = audit_csv(
        REFER / "etrain_delays.csv", "etrain_delays.csv"
    )
    delays_info["unique_trains"] = int(delays_df["train_number"].nunique())
    delays_info["unique_stations"] = int(delays_df["station_code"].nunique())
    delays_info["delay_stats"] = delays_df["average_delay_minutes"].describe().to_dict()
    audits["etrain_delays"] = delays_info

    # 2. Train_details
    details_info, details_df = audit_csv(
        REFER / "Train_details_22122017.csv", "Train_details_22122017.csv"
    )
    details_info["unique_trains"] = int(details_df["Train No"].nunique())
    details_info["unique_stations"] = int(details_df["Station Code"].nunique())
    audits["train_details"] = details_info

    # 3. schedules.json
    sched_info = audit_json(REFER / "schedules.json", "schedules.json")
    audits["schedules"] = sched_info

    # 4. trains.json
    trains_info = audit_json(REFER / "trains.json", "trains.json")
    audits["trains"] = trains_info

    # 5. stations.json
    stations_info = audit_json(REFER / "stations.json", "stations.json")
    audits["stations"] = stations_info

    # Write markdown report
    report = []
    report.append("# RailPulse-X Dataset Audit Report")
    report.append(f"\nGenerated: {datetime.now().isoformat()}")
    report.append("\n## Summary\n")
    report.append("| File | Rows/Records | Key Info |")
    report.append("|---|---|---|")
    report.append(f"| etrain_delays.csv | {delays_info['rows']} rows | {delays_info['unique_trains']} trains, {delays_info['unique_stations']} stations, avg_delay stats |")
    report.append(f"| Train_details_22122017.csv | {details_info['rows']} rows | {details_info['unique_trains']} trains, {details_info['unique_stations']} stations |")
    report.append(f"| schedules.json | {sched_info.get('records', 'N/A')} records | timetable per stop with arrival/departure/day |")
    report.append(f"| trains.json | {trains_info.get('features', 'N/A')} GeoJSON features | LineString routes with metadata |")
    report.append(f"| stations.json | {stations_info.get('features', 'N/A')} GeoJSON features | Point coordinates + zone/state |")

    report.append("\n## etrain_delays.csv Detail\n")
    report.append(f"- **Rows**: {delays_info['rows']}")
    report.append(f"- **Columns**: {delays_info['columns']}")
    report.append(f"- **Unique trains**: {delays_info['unique_trains']}")
    report.append(f"- **Unique stations**: {delays_info['unique_stations']}")
    report.append(f"- **Missing %**: {delays_info['missing_pct']}")
    report.append(f"- **Delay stats**: {delays_info['delay_stats']}")
    report.append("\n> NOTE: This file contains AGGREGATED historical delay statistics scraped on a single date (2025-09-27).")
    report.append("> It is NOT a per-trip time-series. Used to derive real delay distributions for synthetic event construction.")

    report.append("\n## Target Definition\n")
    report.append("**Target**: `delay_minutes` — arrival delay in minutes at each station (positive = late)")
    report.append("\n**Why**: Best supported by available data; aligns with RailPulse-X prediction objective")
    report.append("\n**Strategy**: Construct synthetic event log from schedules.json (timetable backbone)")
    report.append("+ real delay distributions from etrain_delays.csv.")
    report.append("**ALL synthetic data is labeled SYNTHETIC_PROXY throughout the codebase.**")

    report_path = REPORT_DIR / "dataset_audit.md"
    report_path.write_text("\n".join(report), encoding="utf-8")
    print(f"\n[DONE] Audit report written to {report_path}")
    return audits


if __name__ == "__main__":
    main()
