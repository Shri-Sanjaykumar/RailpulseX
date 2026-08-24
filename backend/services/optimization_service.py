"""
RailPulse-X — Optimization Service
Executes Google OR-Tools CP-SAT with CVaR surrogate buffer.
"""
from typing import Dict, List, Any
from backend.optimization.ortools_optimizer import CPSATOptimizer


class OptimizationService:
    def __init__(self, lambda_risk: float = 0.30):
        self.optimizer = CPSATOptimizer(lambda_risk=lambda_risk)

    def optimize(self, scenarios: List[dict], p90: float) -> Dict[str, Any]:
        return self.optimizer.optimize(scenarios, conformal_p90=p90)


optimization_service = OptimizationService()
