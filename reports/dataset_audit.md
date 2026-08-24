# RailPulse-X Dataset Audit Report

Generated: 2026-08-25T00:36:18.767928

## Summary

| File | Rows/Records | Key Info |
|---|---|---|
| etrain_delays.csv | 1900 rows | 90 trains, 480 stations, avg_delay stats |
| Train_details_22122017.csv | 186124 rows | 11113 trains, 8151 stations |
| schedules.json | 417080 records | timetable per stop with arrival/departure/day |
| trains.json | 5208 GeoJSON features | LineString routes with metadata |
| stations.json | 8990 GeoJSON features | Point coordinates + zone/state |

## etrain_delays.csv Detail

- **Rows**: 1900
- **Columns**: ['train_number', 'train_name', 'station_code', 'station_name', 'average_delay_minutes', 'pct_right_time', 'pct_slight_delay', 'pct_significant_delay', 'pct_cancelled_unknown', 'scraped_at', 'source_url']
- **Unique trains**: 90
- **Unique stations**: 480
- **Missing %**: {'train_number': np.float64(0.0), 'train_name': np.float64(0.0), 'station_code': np.float64(0.0), 'station_name': np.float64(0.0), 'average_delay_minutes': np.float64(12.42), 'pct_right_time': np.float64(0.0), 'pct_slight_delay': np.float64(0.0), 'pct_significant_delay': np.float64(0.0), 'pct_cancelled_unknown': np.float64(0.0), 'scraped_at': np.float64(0.0), 'source_url': np.float64(0.0)}
- **Delay stats**: {'count': 1664.0, 'mean': 40.69951923076923, 'std': 50.33795443812415, 'min': 0.0, '25%': 13.0, '50%': 24.0, '75%': 49.0, 'max': 586.0}

> NOTE: This file contains AGGREGATED historical delay statistics scraped on a single date (2025-09-27).
> It is NOT a per-trip time-series. Used to derive real delay distributions for synthetic event construction.

## Target Definition

**Target**: `delay_minutes` — arrival delay in minutes at each station (positive = late)

**Why**: Best supported by available data; aligns with RailPulse-X prediction objective

**Strategy**: Construct synthetic event log from schedules.json (timetable backbone)
+ real delay distributions from etrain_delays.csv.
**ALL synthetic data is labeled SYNTHETIC_PROXY throughout the codebase.**