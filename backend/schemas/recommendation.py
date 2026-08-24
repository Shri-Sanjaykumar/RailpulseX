"""
RailPulse-X — Pydantic Schemas for Recommendation & Optimization
"""
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class RecommendationResponse(BaseModel):
    run_id: str
    recommended_action: str
    scenario_id: str
    expected_cost: float
    tail_risk: float
    avoided_disruption: float
    reduction_percent: float
    constraints: List[str]
    reasoning: List[str]
    binding_constraints: List[str] = []
    ranking: List[Dict[str, Any]] = []


class ReforecastResponse(BaseModel):
    run_id: str
    before_cost: float
    after_cost: float
    avoided_disruption: float
    reduction_percent: float
    new_p50: float
    new_p90: float
    verification_status: str
    verification_color: str
