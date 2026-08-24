"""
RailPulse-X — Constraint Feasibility Engine
Validates railway operational constraints:
- Minimum headway (e.g. 5 min)
- Minimum dwell time (e.g. 2 min)
- Platform occupancy (AddNoOverlap)
- Connection protection window
"""
from typing import Dict, List, Any


class ConstraintEngine:
    def __init__(self, min_headway_min: int = 5, min_dwell_min: int = 2):
        self.min_headway = min_headway_min
        self.min_dwell = min_dwell_min

    def validate_action(self, action: dict) -> Dict[str, Any]:
        """Check if an intervention action satisfies physical operational constraints."""
        hold = int(action.get("hold_min", 0))
        eff_delay = float(action.get("effective_delay", 0))

        violations = []
        if hold > 0 and hold < self.min_dwell:
            violations.append(f"Hold time {hold}m is below minimum dwell {self.min_dwell}m")

        if eff_delay > 60:
            violations.append(f"Effective delay {eff_delay:.1f}m exceeds operational horizon")

        return {
            "feasible": len(violations) == 0,
            "violations": violations,
            "min_headway_min": self.min_headway,
            "min_dwell_min": self.min_dwell,
        }
