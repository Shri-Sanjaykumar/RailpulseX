"""
RailPulse-X — Causal Effect Estimator (Simulation-Derived)

IMPORTANT LABELING:
  All causal effect estimates in this module are SIMULATION-DERIVED.
  We use causal-effect estimation on the replay/simulation environment
  to quantify the differential effect of candidate interventions under
  observed network conditions.
  
  We do NOT claim that this model has learned real causal intervention
  effects from historical Indian Railways operations, since individual
  trip-level intervention data is unavailable.
  
  Reference: Chernozhukov et al. (DML 2018/2024); Microsoft EconML 2024.

Usage:
  ΔY = E[Y(do(action A))] - E[Y(do(action B))]
  Answers: "What is the expected downstream delay reduction if we choose A over B?"
"""
import warnings
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Optional, Tuple

warnings.filterwarnings("ignore")

try:
    from econml.dml import LinearDML, CausalForestDML
    from econml.sklearn_extensions.linear_model import StatsModelsLinearRegression
    HAS_ECONML = True
except ImportError:
    HAS_ECONML = False
    print("[WARN] econml not available — using simplified difference-in-means estimator")

import lightgbm as lgb
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler


CONFOUNDER_COLS = [
    "train_priority",
    "arr_hour",
    "upstream_delay_2hop",
    "station_betweenness",
    "track_occupancy_proxy",
    "headway_margin_minutes",
    "historical_mean_delay",
    "stop_index",
    "route_progress",
]

TREATMENT_COL = "intervention_type"   # 0=proceed, 1=hold, 2=reroute
OUTCOME_COL = "delay_minutes"


class CausalInterventionEstimator:
    """
    Simulation-derived causal effect estimator.
    
    LABEL: SIMULATION-DERIVED CAUSAL ESTIMATION
    
    Estimates: ΔY = E[Y(do A)] - E[Y(do B)] for candidate actions.
    Confounders extracted from NetworkX graph topology + schedule features.
    
    Uses LinearDML (or CausalForestDML) from EconML when available.
    Fallback: tabular difference-in-means with confounder adjustment.
    """

    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.is_fitted = False
        self.data_label = "SIMULATION_DERIVED_CAUSAL_ESTIMATION"

    def fit(self, df: pd.DataFrame):
        """
        Fit causal estimator on simulation-derived dataset.
        df must contain: confounder_cols, treatment_col (0/1), outcome_col
        """
        print(f"[Causal] Fitting estimator — {self.data_label}")
        print(f"[Causal] WARNING: Treatment/outcome derived from simulation, not real IR operations")

        # Select available confounders
        conf_cols = [c for c in CONFOUNDER_COLS if c in df.columns]
        X = df[conf_cols].fillna(0).values
        X_scaled = self.scaler.fit_transform(X)

        # Create synthetic treatment variable from simulation
        # Treatment = 1 if this stop had significant delay (proxy for intervention)
        if TREATMENT_COL not in df.columns:
            df = df.copy()
            df[TREATMENT_COL] = (df["delay_minutes"] > df["historical_mean_delay"]).astype(int)

        T = df[TREATMENT_COL].values.astype(float)
        Y = df[OUTCOME_COL].clip(0, 600).values

        if HAS_ECONML and len(df) >= 200:
            try:
                self.model = LinearDML(
                    model_y=lgb.LGBMRegressor(n_estimators=100, random_state=42, verbose=-1),
                    model_t=lgb.LGBMRegressor(n_estimators=100, random_state=42, verbose=-1),
                    random_state=42,
                    cv=3,
                )
                self.model.fit(Y, T, X=X_scaled)
                self.conf_cols = conf_cols
                self.is_fitted = True
                print(f"[Causal] LinearDML fitted on {len(df)} simulation events, {len(conf_cols)} confounders")
            except Exception as e:
                print(f"[Causal] LinearDML failed ({e}), using Ridge fallback")
                self._fit_ridge(X_scaled, T, Y, conf_cols)
        else:
            self._fit_ridge(X_scaled, T, Y, conf_cols)

        return self

    def _fit_ridge(self, X, T, Y, conf_cols):
        """Simplified Ridge-based treatment effect estimator."""
        # Residualize T on X
        t_model = Ridge(alpha=1.0)
        t_model.fit(X, T)
        T_resid = T - t_model.predict(X)

        # Residualize Y on X
        y_model = Ridge(alpha=1.0)
        y_model.fit(X, Y)
        Y_resid = Y - y_model.predict(X)

        # ATE estimate: regression of Y_resid on T_resid
        ate = np.dot(T_resid, Y_resid) / (np.dot(T_resid, T_resid) + 1e-8)

        self._ate = ate
        self._t_model = t_model
        self._y_model = y_model
        self.conf_cols = conf_cols
        self.is_fitted = True
        print(f"[Causal] Ridge DML fitted. ATE estimate: {ate:.3f} min/intervention")

    def estimate_effect(self, features: dict, action_a: str, action_b: str) -> dict:
        """
        Estimate ΔY = E[Y(do A)] - E[Y(do B)] for given features.
        
        Returns causal effect estimate for ranking interventions.
        Labeled SIMULATION-DERIVED.
        """
        if not self.is_fitted:
            return {"delta_y": 0.0, "label": self.data_label, "note": "Model not fitted"}

        conf_vals = np.array([[features.get(c, 0.0) for c in self.conf_cols]], dtype=float)
        conf_scaled = self.scaler.transform(conf_vals)

        action_map = {"NO_ACTION": 0.0, "HOLD_5MIN": 0.5, "HOLD_10MIN": 0.7,
                      "HOLD_15MIN": 0.8, "PLATFORM_REASSIGN": 0.6,
                      "CONNECTION_PROTECT": 0.65, "REGULATION_ORDER": 0.9}

        t_a = action_map.get(action_a, 0.5)
        t_b = action_map.get(action_b, 0.0)

        if HAS_ECONML and hasattr(self.model, "effect"):
            try:
                effect_a = float(self.model.effect(conf_scaled, T0=np.array([t_b]), T1=np.array([t_a]))[0])
            except Exception:
                effect_a = self._ate * (t_a - t_b)
        else:
            effect_a = self._ate * (t_a - t_b)

        return {
            "delta_y": round(float(effect_a), 4),
            "action_a": action_a,
            "action_b": action_b,
            "interpretation": f"Expected delay change if choosing {action_a} over {action_b}: {effect_a:.2f} min",
            "label": self.data_label,
            "note": "Estimate from simulation-derived causal model. Not from real IR operational data.",
        }

    def rank_interventions(self, features: dict, scenario_results: List[dict]) -> List[dict]:
        """
        Add causal ΔY estimate to each scenario and return ranked list.
        Rank by risk-sensitive J + causal effect adjustment.
        """
        no_action_J = next(
            (r["J_risk_sensitive"] for r in scenario_results if r["scenario_id"] == "NO_ACTION"), 0.0
        )

        ranked = []
        for r in scenario_results:
            effect = self.estimate_effect(features, r["scenario_id"], "NO_ACTION")
            causal_delta_y = effect["delta_y"]

            # Adjusted score: lower is better
            adjusted_J = r["J_risk_sensitive"] + causal_delta_y * 0.3

            ranked.append({
                **r,
                "causal_delta_y": causal_delta_y,
                "causal_label": self.data_label,
                "adjusted_J": round(adjusted_J, 4),
                "avoided_disruption": round(no_action_J - r["J_risk_sensitive"], 4),
            })

        ranked.sort(key=lambda x: x["adjusted_J"])
        return ranked
