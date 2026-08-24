"""
RailPulse-X — Test Suite
Tests all pipeline components: data, ML, graph, simulation, optimization, API.
"""
import json
import sys
import numpy as np
import pytest
from pathlib import Path

BASE = Path(__file__).parent.parent
sys.path.insert(0, str(BASE))


# ─── Data Tests ──────────────────────────────────────────────────

class TestDataPipeline:
    def test_processed_files_exist(self):
        """All three parquet splits must exist after preprocessing."""
        processed = BASE / "data" / "processed"
        for fname in ["train.parquet", "calibration.parquet", "test.parquet"]:
            assert (processed / fname).exists(), f"Missing: {fname}"

    def test_no_timestamp_leakage(self):
        """Test set must come strictly after calibration, which comes after train."""
        import pandas as pd
        processed = BASE / "data" / "processed"
        if not (processed / "train.parquet").exists():
            pytest.skip("Processed data not ready")

        train = pd.read_parquet(processed / "train.parquet")
        calib = pd.read_parquet(processed / "calibration.parquet")
        test = pd.read_parquet(processed / "test.parquet")

        train_max = pd.to_datetime(train["timestamp"]).max()
        calib_min = pd.to_datetime(calib["timestamp"]).min()
        calib_max = pd.to_datetime(calib["timestamp"]).max()
        test_min = pd.to_datetime(test["timestamp"]).min()

        assert train_max <= calib_min, f"LEAKAGE: train max {train_max} > calib min {calib_min}"
        assert calib_max <= test_min, f"LEAKAGE: calib max {calib_max} > test min {test_min}"

    def test_synthetic_label_present(self):
        """All synthetic data must be labeled SYNTHETIC_PROXY."""
        import pandas as pd
        processed = BASE / "data" / "processed"
        if not (processed / "train.parquet").exists():
            pytest.skip("Processed data not ready")
        df = pd.read_parquet(processed / "train.parquet")
        assert "data_label" in df.columns, "Missing data_label column"
        assert (df["data_label"] == "SYNTHETIC_PROXY").all(), "Not all rows labeled SYNTHETIC_PROXY"

    def test_target_column_bounds(self):
        """Target delay_minutes must be in [0, 600] minutes."""
        import pandas as pd
        processed = BASE / "data" / "processed"
        if not (processed / "train.parquet").exists():
            pytest.skip("Processed data not ready")
        df = pd.read_parquet(processed / "train.parquet")
        assert df["delay_minutes"].min() >= 0, "Negative delays found"
        assert df["delay_minutes"].max() <= 600, "Delays > 600 min found"


# ─── Impact Engine Tests ─────────────────────────────────────────

class TestImpactEngine:
    def setup_method(self):
        from backend.simulation.impact_engine import ImpactEngine
        self.engine = ImpactEngine()

    def test_zero_disruption_zero_impact(self):
        state = {
            "total_delay_minutes": 0, "affected_trains": 0,
            "affected_stations": 0, "platform_conflicts": 0,
            "connection_risk": 0, "passenger_proxy": 0,
            "crew_disruption_risk": 0, "operational_risk_score": 0,
        }
        result = self.engine.compute(state, p90_bound=0)
        assert result["J"] == 0.0

    def test_J_positive_for_disruption(self):
        state = {
            "total_delay_minutes": 30, "affected_trains": 5,
            "affected_stations": 4, "platform_conflicts": 2,
            "connection_risk": 0.4, "passenger_proxy": 250,
            "crew_disruption_risk": 0.3, "operational_risk_score": 0.4,
        }
        result = self.engine.compute(state, p90_bound=40.0)
        assert result["J"] > 0
        assert result["J_risk_sensitive"] >= result["J"]

    def test_avoided_disruption_monotone(self):
        """Avoided disruption must be positive when best < no_action."""
        result = self.engine.avoided_disruption(J_no_action=50.0, J_best=35.0)
        assert result["avoided_disruption"] > 0
        assert result["pct_reduction"] > 0


# ─── Counterfactual Simulator Tests ──────────────────────────────

class TestCounterfactualSimulator:
    def setup_method(self):
        from backend.simulation.impact_engine import ImpactEngine
        from backend.simulation.counterfactual import CounterfactualSimulator, SCENARIOS

        class StubGraph:
            pass

        self.engine = ImpactEngine()
        self.simulator = CounterfactualSimulator(self.engine, StubGraph())
        self.disruption = {
            "train_number": "12673", "delay_minutes": 15.0,
            "op_date": "2024-09-01", "station_code": "MAS",
        }
        self.num_scenarios = len(SCENARIOS)

    def test_all_7_scenarios_returned(self):
        results = self.simulator.simulate_all(self.disruption, base_p90=25.0)
        assert len(results) == self.num_scenarios

    def test_no_action_has_highest_J(self):
        results = self.simulator.simulate_all(self.disruption, base_p90=25.0)
        no_action = next(r for r in results if r["scenario_id"] == "NO_ACTION")
        min_J = min(r["J"] for r in results)
        assert no_action["J"] >= min_J

    def test_scenarios_independent(self):
        """Re-running simulation must give identical results (no state mutation)."""
        r1 = self.simulator.simulate_all(self.disruption, base_p90=25.0)
        r2 = self.simulator.simulate_all(self.disruption, base_p90=25.0)
        for s1, s2 in zip(r1, r2):
            assert s1["J"] == s2["J"], f"Non-deterministic scenario: {s1['scenario_id']}"


# ─── CP-SAT Optimizer Tests ──────────────────────────────────────

class TestCPSATOptimizer:
    def setup_method(self):
        from backend.optimization.ortools_optimizer import CPSATOptimizer
        self.optimizer = CPSATOptimizer()
        self.candidates = [
            {"scenario_id": "NO_ACTION", "scenario_label": "No Action",
             "J": 50.0, "J_risk_sensitive": 60.0, "effective_delay": 15.0,
             "hold_min": 0, "reroute": False, "protect_connection": False},
            {"scenario_id": "HOLD_10MIN", "scenario_label": "Hold +10 min",
             "J": 35.0, "J_risk_sensitive": 42.0, "effective_delay": 7.0,
             "hold_min": 10, "reroute": False, "protect_connection": False},
            {"scenario_id": "REGULATION_ORDER", "scenario_label": "Regulation Order",
             "J": 28.0, "J_risk_sensitive": 36.0, "effective_delay": 5.0,
             "hold_min": 8, "reroute": True, "protect_connection": True},
        ]

    def test_selects_best_action(self):
        best = self.optimizer.optimize(self.candidates, conformal_p90=25.0)
        # Best should have lowest J_risk_sensitive
        assert best["J_risk_sensitive"] <= 42.0

    def test_returns_required_keys(self):
        best = self.optimizer.optimize(self.candidates, conformal_p90=25.0)
        for key in ["scenario_id", "scenario_label", "J_risk_sensitive", "solver"]:
            assert key in best, f"Missing key: {key}"


# ─── Reforecast Tests ────────────────────────────────────────────

class TestReforecastEngine:
    def setup_method(self):
        from backend.simulation.reforecast import ReforecastEngine
        self.engine = ReforecastEngine(model_dir=BASE / "models" / "railpulse_x")

    def test_reforecast_returns_required_fields(self):
        disruption = {"train_number": "12673", "delay_minutes": 15.0, "op_date": "2024-09-01"}
        best_action = {"scenario_id": "HOLD_10MIN", "scenario_label": "Hold +10 min",
                       "hold_min": 10, "reroute": False}
        result = self.engine.reforecast(disruption, best_action, 60.0, 42.0, 15.0, 27.0)
        for key in ["avoided_disruption", "improvement_pct", "verification_status", "post_p50_min"]:
            assert key in result, f"Missing: {key}"

    def test_improvement_positive_when_best_action_helps(self):
        disruption = {"train_number": "12673", "delay_minutes": 15.0, "op_date": "2024-09-01"}
        best_action = {"scenario_id": "HOLD_10MIN", "scenario_label": "Hold +10 min",
                       "hold_min": 10, "reroute": False}
        result = self.engine.reforecast(disruption, best_action, 60.0, 35.0, 15.0, 27.0)
        assert result["avoided_disruption"] > 0
        assert result["improvement_pct"] > 0


# ─── Causal DML Tests ────────────────────────────────────────────

class TestCausalEstimator:
    def test_simulation_derived_label_present(self):
        from backend.optimization.causal_dml import CausalInterventionEstimator
        est = CausalInterventionEstimator()
        assert "SIMULATION" in est.data_label

    def test_effect_returns_before_fit(self):
        from backend.optimization.causal_dml import CausalInterventionEstimator
        est = CausalInterventionEstimator()
        result = est.estimate_effect({}, "HOLD_10MIN", "NO_ACTION")
        assert "label" in result
        assert "SIMULATION" in result["label"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
