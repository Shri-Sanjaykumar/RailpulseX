"""
RailPulse-X — Routes: Network State & Disruption Injection
Endpoints:
  GET  /network/state
  GET  /network/impact/{train_id}
  POST /network/disruption
"""
import uuid
from fastapi import APIRouter, HTTPException, Query
from backend.schemas.simulation import DisruptionInput, DisruptionResponse
from backend.services.prediction_service import prediction_service
from backend.services.graph_service import graph_service
from backend.services.simulation_service import simulation_service
from backend.simulation.state import state_manager

router = APIRouter(tags=["Network"])


@router.get("/network/state")
async def get_network_state():
    """Retrieve full operational network state."""
    return state_manager.get_full_state()


@router.get("/network/impact/{train_id}")
async def get_train_network_impact(
    train_id: str,
    delay_minutes: float = Query(15.0, description="Delay in minutes")
):
    """Calculate network cascade and impact of a delayed train."""
    cascade = graph_service.get_cascade(train_id, delay_minutes)
    eta = prediction_service.get_eta_forecast(train_id, delay_minutes)
    canonical_no_action = simulation_service.get_canonical_no_action(
        {"train_number": train_id, "delay_minutes": delay_minutes}, p90=eta["p90"]
    )
    return {
        "train_id": train_id,
        "delay_minutes": delay_minutes,
        "eta": eta,
        "cascade": cascade,
        "impact": canonical_no_action["components"],
        "J_no_action": canonical_no_action["J_risk_sensitive"],
    }


@router.post("/network/disruption", response_model=DisruptionResponse)
async def inject_disruption(req: DisruptionInput):
    """
    Core Disruption Entry Point:
    Injects a delay into the network, generates calibrated ETA uncertainty,
    propagates the cascade across physical blocks, and computes canonical J_NO_ACTION.
    """
    incident_id = f"inc_{uuid.uuid4().hex[:8]}"
    weather = req.weather_condition or "NORMAL"
    eta = prediction_service.get_eta_forecast(req.train_id, req.delay_minutes, req.station_id or "MAS", weather_condition=weather)
    cascade = graph_service.get_cascade(req.train_id, req.delay_minutes)
    canonical_no_action = simulation_service.get_canonical_no_action(
        {"train_number": req.train_id, "delay_minutes": req.delay_minutes, "station_code": req.station_id},
        p90=eta["p90"]
    )

    incident_data = {
        "incident_id": incident_id,
        "train_id": req.train_id,
        "station_id": req.station_id or "MAS",
        "delay_minutes": req.delay_minutes,
        "eta": eta,
        "cascade": cascade,
        "impact": canonical_no_action["components"],
        "canonical_no_action": canonical_no_action,
    }
    state_manager.set_disruption(incident_id, incident_data)

    return DisruptionResponse(
        incident_id=incident_id,
        train_id=req.train_id,
        delay_minutes=req.delay_minutes,
        eta=eta,
        cascade=cascade,
        impact=canonical_no_action["components"],
    )
