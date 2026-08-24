"""
RailPulse-X — Network State Manager
Maintains in-memory and Redis operational state snapshots.
"""
from typing import Dict, Any, List, Optional
import copy


class NetworkStateManager:
    def __init__(self):
        self._current_state: Dict[str, Any] = {
            "active_disruptions": {},
            "simulation_runs": {},
            "trains": {},
            "stations": {},
        }

    def set_disruption(self, incident_id: str, data: dict):
        self._current_state["active_disruptions"][incident_id] = copy.deepcopy(data)

    def get_disruption(self, incident_id: str) -> Optional[dict]:
        return copy.deepcopy(self._current_state["active_disruptions"].get(incident_id))

    def set_simulation_run(self, run_id: str, data: dict):
        self._current_state["simulation_runs"][run_id] = copy.deepcopy(data)

    def get_simulation_run(self, run_id: str) -> Optional[dict]:
        return copy.deepcopy(self._current_state["simulation_runs"].get(run_id))

    def get_full_state(self) -> dict:
        return copy.deepcopy(self._current_state)


state_manager = NetworkStateManager()
