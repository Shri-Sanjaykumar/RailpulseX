"""
RailPulse-X — Pydantic Schemas for Disruption & Interventions
"""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class DisruptionInput(BaseModel):
    train_number: str = Field(..., example="12673")
    delay_minutes: float = Field(..., ge=0, le=300, example=15.0)
    station_code: Optional[str] = Field("MAS", example="MAS")
    op_date: Optional[str] = Field("2024-09-01", example="2024-09-01")
    reason: Optional[str] = Field("SIGNAL_FAILURE", example="SIGNAL_FAILURE")


class ScenarioComponentScores(BaseModel):
    passenger: float
    train_delay: float
    connection_miss: float
    platform_conflict: float
    crew_disruption: float
    operational_risk: float


class ScenarioOutput(BaseModel):
    scenario_id: str
    scenario_label: str
    hold_min: int
    reroute: bool
    protect_connection: bool
    effective_delay: float
    J: float
    J_risk_sensitive: float
    components: ScenarioComponentScores
    cvar_penalty: float


class OptimizationResult(BaseModel):
    selected_scenario_id: str
    selected_scenario_label: str
    J_risk_sensitive: float
    solver: str
    solve_time_ms: float
    cvar_p90_used: float
    cvar_lambda: float


class ReforecastResult(BaseModel):
    original_delay_min: float
    post_intervention_delay_min: float
    post_p50_min: float
    post_p90_min: float
    J_no_action: float
    J_best_action: float
    avoided_disruption: float
    improvement_pct: float
    verification_status: str
    verification_color: str
    best_action_label: str
