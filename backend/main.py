"""
RailPulse-X — Main FastAPI Application
Uncertainty-Aware Counterfactual Railway Intervention Engine

Endpoints:
  GET  /health
  GET  /trains/{train_id}/eta
  GET  /network/state
  GET  /network/impact/{train_id}
  POST /network/disruption
  POST /simulate
  GET  /simulation/{run_id}
  GET  /recommendation/{run_id}
  POST /recommendation/{run_id}/apply
  POST /reforecast/{run_id}
  WS   /stream
  WS   /ws/network (Dashboard compatibility)
"""
import json
import logging
import sys
import warnings
from pathlib import Path
from typing import Dict, Any, List

import pandas as pd
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

warnings.filterwarnings("ignore")

BASE = Path(__file__).parent.parent
sys.path.insert(0, str(BASE))

from backend.api.routes_eta import router as router_eta
from backend.api.routes_network import router as router_network
from backend.api.routes_simulation import router as router_simulation
from backend.api.routes_recommendation import router as router_recommendation
from backend.api.routes_stream import router as router_stream

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("railpulse-x")

app = FastAPI(
    title="RailPulse-X API",
    description="Uncertainty-Aware Counterfactual Railway Intervention Engine (SIH 2026 | PS 26028)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount modular routers
app.include_router(router_eta)
app.include_router(router_network)
app.include_router(router_simulation)
app.include_router(router_recommendation)
app.include_router(router_stream)


# ─── Base Health & Static Data Endpoints ─────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "RailPulse-X",
        "version": "1.0.0",
        "architecture": "GATv2 + Residual LightGBM + CQR + NetworkX + EconML + CP-SAT",
        "data_origin": "SYNTHETIC_PROXY",
    }


@app.get("/api/trains")
async def get_trains():
    """Returns active train list for dashboard."""
    try:
        test_path = BASE / "data" / "processed" / "test.parquet"
        if test_path.exists():
            df = pd.read_parquet(test_path)
            trains = []
            for t_no, grp in df.groupby("train_number"):
                row = grp.iloc[0]
                trains.append({
                    "train_number": str(t_no),
                    "train_name": str(row.get("train_name", f"Train {t_no}")),
                    "current_station": str(row.get("station_code", "MAS")),
                    "delay_minutes": round(float(row.get("delay_minutes", 0)), 1),
                    "status": "ON_TIME" if row.get("delay_minutes", 0) < 5 else "DELAYED",
                    "priority": float(row.get("train_priority", 0.5)),
                })
            return {"trains": trains[:30], "count": len(trains[:30])}
    except Exception as e:
        logger.warning(f"Could not load trains: {e}")

    return {
        "trains": [
            {"train_number": "12673", "train_name": "Cheran Express", "current_station": "MAS", "delay_minutes": 15.0, "status": "DELAYED", "priority": 0.7},
            {"train_number": "12001", "train_name": "Bhopal Shatabdi", "current_station": "NDLS", "delay_minutes": 0.0, "status": "ON_TIME", "priority": 1.0},
        ],
        "count": 2
    }


@app.get("/api/stations")
async def get_stations():
    """Returns station locations for dashboard map."""
    try:
        test_path = BASE / "data" / "processed" / "test.parquet"
        if test_path.exists():
            df = pd.read_parquet(test_path)
            stations = []
            seen = set()
            for _, row in df.iterrows():
                code = str(row.get("station_code", ""))
                if code in seen:
                    continue
                seen.add(code)
                stations.append({
                    "station_code": code,
                    "lat": float(row.get("lat", 20.0)),
                    "lon": float(row.get("lon", 78.0)),
                    "zone": str(row.get("zone", "SR")),
                    "delay_index": float(row.get("historical_mean_delay", 5.0)),
                })
                if len(stations) >= 50:
                    break
            return {"stations": stations, "count": len(stations)}
    except Exception as e:
        logger.warning(f"Could not load stations: {e}")

    return {
        "stations": [
            {"station_code": "MAS", "lat": 13.0827, "lon": 80.2707, "zone": "SR", "delay_index": 12.0},
            {"station_code": "NDLS", "lat": 28.6447, "lon": 77.2194, "zone": "NR", "delay_index": 8.0},
            {"station_code": "CSTM", "lat": 18.9398, "lon": 72.8354, "zone": "CR", "delay_index": 10.0},
            {"station_code": "HWH", "lat": 22.5831, "lon": 88.3426, "zone": "ER", "delay_index": 15.0},
        ],
        "count": 4
    }


@app.get("/api/metrics")
async def get_metrics():
    """Returns model comparison benchmark metrics."""
    comparison_file = BASE / "reports" / "model_comparison.json"
    if comparison_file.exists():
        with open(comparison_file) as f:
            return json.load(f)
    return {"note": "Run evaluate_models.py to generate metrics."}


# ─── Dashboard Compatibility Route ───────────────────────────────

@app.post("/api/disrupt")
async def dashboard_disrupt(req: dict):
    """Bridge for dashboard single-click execution."""
    from backend.api.routes_network import inject_disruption
    from backend.schemas.simulation import DisruptionInput
    from backend.api.routes_simulation import run_simulation
    from backend.schemas.simulation import SimulateRequest
    from backend.api.routes_recommendation import get_recommendation, run_reforecast

    t_id = str(req.get("train_number", "12673"))
    s_id = str(req.get("station_code", "MAS"))
    d_min = float(req.get("delay_minutes", 15.0))

    # 1. Disruption
    disrupt_res = await inject_disruption(DisruptionInput(train_id=t_id, station_id=s_id, delay_minutes=d_min))
    # 2. Simulate
    sim_res = await run_simulation(SimulateRequest(incident_id=disrupt_res.incident_id))
    # 3. Recommend
    rec_res = await get_recommendation(sim_res.run_id)
    # 4. Reforecast
    reforecast_res = await run_reforecast(sim_res.run_id)

    return {
        "status": "OK",
        "affected_trains": len(disrupt_res.cascade.get("affected_trains", [])),
        "affected_stations": len(disrupt_res.cascade.get("affected_stations", [])),
        "scenario_count": len(sim_res.scenarios),
        "best_action_id": rec_res.scenario_id,
        "J_no_action": reforecast_res.before_cost,
        "J_best": reforecast_res.after_cost,
        "avoided_disruption": reforecast_res.avoided_disruption,
        "improvement_pct": reforecast_res.reduction_percent,
        "run_id": sim_res.run_id,
    }


@app.get("/api/scenarios")
async def get_latest_scenarios():
    from backend.simulation.state import state_manager
    runs = state_manager._current_state.get("simulation_runs", {})
    if runs:
        latest_run = list(runs.values())[-1]
        return {"scenarios": latest_run["scenarios"], "count": len(latest_run["scenarios"])}
    return {"scenarios": [], "count": 0}


@app.get("/api/best-action")
async def get_latest_best_action():
    from backend.simulation.state import state_manager
    runs = state_manager._current_state.get("simulation_runs", {})
    if runs:
        latest_run = list(runs.values())[-1]
        if latest_run.get("best_action"):
            return latest_run["best_action"]
    return None


@app.get("/api/reforecast")
async def get_latest_reforecast():
    from backend.simulation.state import state_manager
    from backend.services.reforecast_service import reforecast_service
    runs = state_manager._current_state.get("simulation_runs", {})
    if runs:
        latest_run = list(runs.values())[-1]
        if latest_run.get("best_action"):
            best = latest_run["best_action"]
            disr = latest_run["disruption"]
            return reforecast_service.run_reforecast(
                disr, best, latest_run["canonical_j_no_action"], best["J_risk_sensitive"],
                float(disr.get("delay_minutes", 15.0)), latest_run["p90"]
            )
    return None


@app.websocket("/ws/network")
async def ws_network_compat(ws: WebSocket):
    from backend.api.routes_stream import router as stream_router
    await ws.accept()
    try:
        while True:
            await ws.receive_text()
    except Exception:
        pass


if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
