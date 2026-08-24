"""
RailPulse-X — Reforecast Verification Service
Performs the closed-loop reforecast cycle and computes avoided disruption.
"""
from typing import Dict, Any
from backend.simulation.reforecast import ReforecastEngine


class ReforecastService:
    def __init__(self):
        self.engine = ReforecastEngine()

    def run_reforecast(
        self,
        disruption: dict,
        best_action: dict,
        j_no_action: float,
        j_best: float,
        p50: float,
        p90: float
    ) -> Dict[str, Any]:
        return self.engine.reforecast(
            disruption, best_action, j_no_action, j_best, p50, p90
        )


reforecast_service = ReforecastService()
