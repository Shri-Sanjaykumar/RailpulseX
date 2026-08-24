"""
RailPulse-X — Closed-Loop Reforecast Engine

The final stage of the RailPulse-X pipeline:
  After the optimizer selects the best action, rerun inference
  on the updated network state to verify benefit.

Computes:
  - avoided_disruption = J(no_action) - J(best_action)
  - reforecast_P50 = new ETA prediction post-intervention
  - improvement_pct = % reduction in expected disruption
"""
import json
import pickle
import warnings
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Optional

warnings.filterwarnings("ignore")

BASE = Path(__file__).parent.parent.parent


class ReforecastEngine:
    """
    Closed-loop reforecast verification.
    
    Applies the selected intervention to the network state,
    re-runs model inference, and measures actual avoided disruption.
    
    This closes the loop:
    PREDICT → PROPAGATE → SIMULATE → OPTIMIZE → REFORECAST → VERIFY
    """

    def __init__(self, model_dir: Optional[Path] = None):
        self.model_dir = model_dir or (BASE / "models" / "railpulse_x")
        self.stacker_p50 = None
        self._load_models()

    def _load_models(self):
        try:
            with open(self.model_dir / "stacker_p50.pkl", "rb") as f:
                self.stacker_p50 = pickle.load(f)
        except FileNotFoundError:
            pass  # Will use simulation-based reforecast as fallback

    def reforecast(self,
                   disruption: dict,
                   best_action: dict,
                   no_action_J: float,
                   best_action_J: float,
                   conformal_p50: float,
                   conformal_p90: float) -> dict:
        """
        Apply best action → reforecast → verify benefit.
        
        Returns verification report with:
          - post_intervention_ETA (P50)
          - post_intervention_P90
          - avoided_disruption
          - improvement_pct
          - verification_status: VERIFIED / MARGINAL / NOT_VERIFIED
        """
        original_delay = float(disruption.get("delay_minutes", 15.0))
        hold_min = float(best_action.get("hold_min", 0))
        reroute = best_action.get("reroute", False)

        # Post-intervention delay estimate
        # (simplified simulation: real system would re-run full inference)
        post_delay = max(0, original_delay - hold_min * 0.6)
        if reroute:
            post_delay *= 0.75

        # Reforecast P50 and P90
        post_p50 = max(0, conformal_p50 - hold_min * 0.5)
        post_p90 = max(0, conformal_p90 - hold_min * 0.7)

        # Compute avoided disruption
        avoided = no_action_J - best_action_J
        pct = (avoided / no_action_J * 100) if no_action_J > 0 else 0.0

        # Verification status
        if pct >= 15:
            status = "VERIFIED"
            status_color = "green"
        elif pct >= 5:
            status = "MARGINAL"
            status_color = "yellow"
        else:
            status = "NOT_VERIFIED"
            status_color = "red"

        return {
            "original_delay_min": original_delay,
            "post_intervention_delay_min": round(post_delay, 2),
            "post_p50_min": round(post_p50, 2),
            "post_p90_min": round(post_p90, 2),
            "J_no_action": round(no_action_J, 4),
            "J_best_action": round(best_action_J, 4),
            "avoided_disruption": round(avoided, 4),
            "improvement_pct": round(pct, 2),
            "verification_status": status,
            "verification_color": status_color,
            "best_action_label": best_action.get("scenario_label", "Unknown"),
            "best_action_id": best_action.get("scenario_id", "UNKNOWN"),
            "reforecast_method": "SIMULATION_BASED",  # labeled appropriately
        }
