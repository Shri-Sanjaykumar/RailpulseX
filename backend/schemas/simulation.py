"""
RailPulse-X — Pydantic Schemas for 7-Scenario Simulation
"""
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class DisruptionInput(BaseModel):
    train_id: str = Field(..., example="12673")
    station_id: Optional[str] = Field("MAS", example="MAS")
    delay_minutes: float = Field(..., ge=0, le=300, example=15.0)
    weather_condition: Optional[str] = Field("NORMAL", example="NORMAL")


class DisruptionResponse(BaseModel):
    incident_id: str
    train_id: str
    delay_minutes: float
    eta: Dict[str, Any]
    cascade: Dict[str, Any]
    impact: Dict[str, Any]


class SimulateRequest(BaseModel):
    incident_id: str
    scenarios: str = "ALL"


class ScenarioDetail(BaseModel):
    scenario_id: str
    scenario_label: str
    hold_min: int
    reroute: bool
    protect_connection: bool
    effective_delay: float
    J: float
    J_risk_sensitive: float
    feasible: bool = True
    components: Dict[str, float]
    cvar_penalty: float


class SimulateResponse(BaseModel):
    run_id: str
    scenarios: List[ScenarioDetail]
    canonical_j_no_action: float
