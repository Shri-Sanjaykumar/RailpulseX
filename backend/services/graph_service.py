"""
RailPulse-X — Graph Service
Manages dynamic graph operations and BFS cascade propagation.
"""
from typing import Dict, Any
from backend.graph.railway_graph import RailwayGraph
from backend.graph.propagation import propagate_delay


class GraphService:
    def __init__(self):
        self.graph = RailwayGraph()

    def get_cascade(self, train_id: str, delay_minutes: float) -> Dict[str, Any]:
        return propagate_delay(self.graph.G, train_id, delay_minutes)


graph_service = GraphService()
