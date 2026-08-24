"""
RailPulse-X — Causal Service (SIMULATION-DERIVED)
Estimates differential intervention impact Delta Y = E[Y(do A)] - E[Y(do B)].
"""
from typing import Dict, List, Any
from backend.optimization.causal_dml import CausalInterventionEstimator


class CausalService:
    def __init__(self):
        self.estimator = CausalInterventionEstimator()

    def rank_scenarios(self, features: dict, scenarios: List[dict]) -> List[dict]:
        return self.estimator.rank_interventions(features, scenarios)


causal_service = CausalService()
