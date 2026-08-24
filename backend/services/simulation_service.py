"""
RailPulse-X — Simulation Service
Coordinates the 7-scenario counterfactual evaluation and guarantees single canonical J_NO_ACTION.
"""
from typing import Dict, List, Any
from backend.simulation.impact_engine import ImpactEngine
from backend.simulation.counterfactual import CounterfactualSimulator
from backend.graph.railway_graph import RailwayGraph


class SimulationService:
    def __init__(self):
        self.impact_engine = ImpactEngine()
        self.simulator = CounterfactualSimulator(self.impact_engine, RailwayGraph())

    def run_all_scenarios(self, disruption: dict, p90: float) -> List[Dict[str, Any]]:
        return self.simulator.simulate_all(disruption, base_p90=p90)

    def get_canonical_no_action(self, disruption: dict, p90: float) -> Dict[str, Any]:
        return self.simulator.get_baseline_no_action(disruption, base_p90=p90)


simulation_service = SimulationService()
