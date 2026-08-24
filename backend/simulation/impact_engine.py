"""
RailPulse-X — Impact Engine
Computes J(a) = weighted network disruption score

J(a) = wp * passenger_delay
     + wt * train_delay
     + wc * connection_miss
     + wf * platform_conflict
     + wk * crew_disruption
     + wr * operational_risk

Risk-sensitive extension:
RiskSensitiveCost(a) = E[J(a)] + lambda * P90_tail_disruption
where P90 comes from conformal prediction intervals.
"""
import yaml
import numpy as np
from pathlib import Path
from typing import Dict, Optional


BASE = Path(__file__).parent.parent.parent
OBJECTIVE_CONFIG = BASE / "configs" / "objective.yaml"


def load_weights() -> dict:
    with open(OBJECTIVE_CONFIG) as f:
        cfg = yaml.safe_load(f)
    return cfg["weights"], cfg["risk"]


class ImpactEngine:
    """
    Computes weighted network disruption score J(a) for a given scenario.
    
    Weights are configurable via configs/objective.yaml.
    The risk-sensitive variant adds CVaR tail penalty using conformal P90 intervals.
    """

    def __init__(self):
        weights, risk_cfg = load_weights()
        self.wp = weights.get("passenger_delay", 0.35)
        self.wt = weights.get("train_delay", 0.25)
        self.wc = weights.get("connection_miss", 0.20)
        self.wf = weights.get("platform_conflict", 0.10)
        self.wk = weights.get("crew_disruption", 0.05)
        self.wr = weights.get("operational_risk", 0.05)
        self.lambda_cvar = risk_cfg.get("lambda_cvar", 0.30)
        self.cvar_alpha = risk_cfg.get("cvar_alpha", 0.90)

    def compute(self, scenario: dict, p90_bound: float = 0.0) -> dict:
        """
        Compute J(a) for a scenario dict.
        
        scenario keys:
          total_delay_minutes, affected_trains, affected_stations,
          platform_conflicts, connection_risk, passenger_proxy,
          crew_disruption_risk, operational_risk_score
        
        p90_bound: conformal P90 prediction for this scenario (minutes).
                   Used for CVaR-aware objective.
        """
        total_delay = float(scenario.get("total_delay_minutes", 0))
        n_trains = float(scenario.get("affected_trains", 0))
        platform_conflicts = float(scenario.get("platform_conflicts", 0))
        connection_risk = float(scenario.get("connection_risk", 0))
        passenger_proxy = float(scenario.get("passenger_proxy", n_trains * 50))
        crew_risk = float(scenario.get("crew_disruption_risk", 0.1))
        op_risk = float(scenario.get("operational_risk_score", 0.1))

        # Normalize components (scale to [0, 100])
        passenger_component = min(passenger_proxy / 500.0, 1.0) * 100
        train_component = min(total_delay / 200.0, 1.0) * 100
        connection_component = connection_risk * 100
        platform_component = min(platform_conflicts / 5.0, 1.0) * 100
        crew_component = crew_risk * 100
        op_component = op_risk * 100

        # Weighted sum
        J = (
            self.wp * passenger_component
            + self.wt * train_component
            + self.wc * connection_component
            + self.wf * platform_component
            + self.wk * crew_component
            + self.wr * op_component
        )

        # CVaR risk-sensitive objective
        # Risk-aware headway buffer: add λ * P90 tail penalty
        # P90 from conformal prediction intervals
        cvar_penalty = self.lambda_cvar * min(p90_bound / 100.0, 1.0) * 100
        risk_sensitive_J = J + cvar_penalty

        return {
            "J": round(J, 4),
            "J_risk_sensitive": round(risk_sensitive_J, 4),
            "components": {
                "passenger": round(passenger_component, 2),
                "train_delay": round(train_component, 2),
                "connection_miss": round(connection_component, 2),
                "platform_conflict": round(platform_component, 2),
                "crew_disruption": round(crew_component, 2),
                "operational_risk": round(op_component, 2),
            },
            "cvar_penalty": round(cvar_penalty, 4),
            "inputs": scenario,
        }

    def avoided_disruption(self, J_no_action: float, J_best: float) -> dict:
        """
        Compute avoided disruption = J(no_action) - J(recommended_action).
        This is the core measurement of system benefit.
        """
        avoided = J_no_action - J_best
        pct_reduction = (avoided / J_no_action * 100) if J_no_action > 0 else 0.0
        return {
            "J_no_action": round(J_no_action, 4),
            "J_recommended": round(J_best, 4),
            "avoided_disruption": round(avoided, 4),
            "pct_reduction": round(pct_reduction, 2),
        }
