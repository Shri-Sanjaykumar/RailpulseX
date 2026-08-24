"""
RailPulse-X — Routes: 7-Scenario Counterfactual Simulation
Endpoints:
  POST /simulate
  GET  /simulation/{run_id}
"""
import uuid
from fastapi import APIRouter, HTTPException
from backend.schemas.simulation import SimulateRequest, SimulateResponse, ScenarioDetail
from backend.services.simulation_service import simulation_service
from backend.services.causal_service import causal_service
from backend.simulation.state import state_manager

router = APIRouter(tags=["Simulation"])


@router.post("/simulate", response_model=SimulateResponse)
async def run_simulation(req: SimulateRequest):
    """
    Executes 7 independent counterfactual interventions from the frozen incident base state.
    Calculates J(a), estimates simulation-derived causal treatment effect, and returns all scenarios.
    """
    incident = state_manager.get_disruption(req.incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {req.incident_id} not found. Call POST /network/disruption first.")

    run_id = f"sim_{uuid.uuid4().hex[:8]}"
    disruption = {
        "train_number": incident["train_id"],
        "delay_minutes": incident["delay_minutes"],
        "station_code": incident["station_id"],
    }
    p90 = incident["eta"]["p90"]

    scenarios = simulation_service.run_all_scenarios(disruption, p90=p90)
    no_action = next(s for s in scenarios if s["scenario_id"] == "NO_ACTION")

    # Add causal effect ranking
    features = {
        "train_priority": 0.7, "arr_hour": 14,
        "upstream_delay_2hop": incident["delay_minutes"] * 0.5,
        "station_betweenness": 0.6, "track_occupancy_proxy": 0.4,
        "headway_margin_minutes": 8.0, "historical_mean_delay": 12.0,
        "stop_index": 3, "route_progress": 0.4,
    }
    ranked_scenarios = causal_service.rank_scenarios(features, scenarios)

    sim_data = {
        "run_id": run_id,
        "incident_id": req.incident_id,
        "disruption": disruption,
        "p90": p90,
        "scenarios": ranked_scenarios,
        "canonical_j_no_action": no_action["J_risk_sensitive"],
    }
    state_manager.set_simulation_run(run_id, sim_data)

    scenario_details = [
        ScenarioDetail(
            scenario_id=s["scenario_id"],
            scenario_label=s["scenario_label"],
            hold_min=s["hold_min"],
            reroute=s["reroute"],
            protect_connection=s["protect_connection"],
            effective_delay=s["effective_delay"],
            J=s["J"],
            J_risk_sensitive=s["J_risk_sensitive"],
            feasible=True,
            components=s["components"],
            cvar_penalty=s["cvar_penalty"],
        )
        for s in ranked_scenarios
    ]

    return SimulateResponse(
        run_id=run_id,
        scenarios=scenario_details,
        canonical_j_no_action=no_action["J_risk_sensitive"],
    )


@router.get("/simulation/{run_id}", response_model=SimulateResponse)
async def get_simulation_run(run_id: str):
    """Retrieve saved simulation run results."""
    sim = state_manager.get_simulation_run(run_id)
    if not sim:
        raise HTTPException(status_code=404, detail=f"Simulation run {run_id} not found.")

    scenario_details = [
        ScenarioDetail(
            scenario_id=s["scenario_id"],
            scenario_label=s["scenario_label"],
            hold_min=s["hold_min"],
            reroute=s["reroute"],
            protect_connection=s["protect_connection"],
            effective_delay=s["effective_delay"],
            J=s["J"],
            J_risk_sensitive=s["J_risk_sensitive"],
            feasible=True,
            components=s["components"],
            cvar_penalty=s["cvar_penalty"],
        )
        for s in sim["scenarios"]
    ]

    return SimulateResponse(
        run_id=run_id,
        scenarios=scenario_details,
        canonical_j_no_action=sim["canonical_j_no_action"],
    )
