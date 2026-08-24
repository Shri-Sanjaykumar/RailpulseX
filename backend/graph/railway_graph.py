"""
RailPulse-X — Railway Graph Engine
Constructs and maintains the dynamic graph G(t) = (V, E, X(t))

Nodes: TrainEvent(k,i), Station(i)
Edges: ConsecutiveTrip, StationHost, HeadwayConflict

Used for:
- Delay propagation via BFS/DFS
- Graph feature extraction (betweenness, degree, upstream delay)
- Impact computation
"""
import json
import sys
import warnings
import numpy as np
import pandas as pd
import networkx as nx
import pickle
from pathlib import Path
from typing import Dict, List, Optional, Tuple

warnings.filterwarnings("ignore")

BASE = Path(__file__).parent.parent.parent
sys.path.insert(0, str(BASE))


class RailwayGraph:
    """
    Dynamic Railway Graph G(t) = (V, E, X(t))
    
    Maintains current network state and supports:
    - Delay injection
    - Cascade propagation (BFS)
    - Impact scoring J(a)
    - Graph feature extraction for ML
    """

    def __init__(self):
        self.G = nx.DiGraph()
        self.station_data: Dict[str, dict] = {}
        self.train_data: Dict[str, dict] = {}
        self.schedule: Optional[pd.DataFrame] = None
        self.current_delays: Dict[str, float] = {}  # (train_no, station_code) -> delay_minutes
        self._centrality_cache = {}

    def build_from_schedule(self, schedule_df: pd.DataFrame,
                              station_df: Optional[pd.DataFrame] = None,
                              delays_df: Optional[pd.DataFrame] = None):
        """
        Build graph from schedule DataFrame.
        schedule_df must have: train_number, station_code, stop_index, op_date, delay_minutes
        """
        self.schedule = schedule_df.copy()
        self.G.clear()

        # Add station nodes
        station_codes = schedule_df["station_code"].unique()
        for stn in station_codes:
            node_id = f"STN_{stn}"
            stn_data = {"type": "station", "station_code": stn, "platform_count": 2}
            if station_df is not None and "station_code" in station_df.columns:
                row = station_df[station_df["station_code"] == stn]
                if not row.empty:
                    stn_data.update({
                        "lat": float(row.iloc[0].get("lat", 0)),
                        "lon": float(row.iloc[0].get("lon", 0)),
                        "zone": str(row.iloc[0].get("zone", "")),
                    })
            self.G.add_node(node_id, **stn_data)
            self.station_data[stn] = stn_data

        # Add TrainEvent nodes and edges
        grouped = schedule_df.groupby(["train_number", "op_date"])
        for (train_no, op_date), grp in grouped:
            grp = grp.sort_values("stop_index").reset_index(drop=True)

            for i, row in grp.iterrows():
                stn = row["station_code"]
                ev_id = f"EV_{train_no}_{stn}_{op_date}"

                delay = float(row.get("delay_minutes", 0))
                self.current_delays[(str(train_no), str(stn))] = delay

                self.G.add_node(ev_id, {
                    "type": "train_event",
                    "train_number": str(train_no),
                    "station_code": stn,
                    "op_date": str(op_date),
                    "stop_index": int(row.get("stop_index", 0)),
                    "delay_minutes": delay,
                    "train_priority": float(row.get("train_priority", 0.5)),
                    "historical_mean_delay": float(row.get("historical_mean_delay", 5.0)),
                })

                # StationHost edge: event → station
                stn_node = f"STN_{stn}"
                if stn_node in self.G:
                    self.G.add_edge(ev_id, stn_node, edge_type="station_host", weight=1.0)

        # ConsecutiveTrip edges: same train, consecutive stops
        for (train_no, op_date), grp in grouped:
            grp = grp.sort_values("stop_index").reset_index(drop=True)
            events = grp["station_code"].tolist()
            for j in range(len(events) - 1):
                src = f"EV_{train_no}_{events[j]}_{op_date}"
                dst = f"EV_{train_no}_{events[j+1]}_{op_date}"
                if src in self.G and dst in self.G:
                    self.G.add_edge(src, dst, edge_type="consecutive_trip",
                                    weight=0.8, propagation_factor=0.6)

        # HeadwayConflict edges: different trains at same station within 15 min
        self._add_headway_edges(schedule_df, threshold_min=15.0)

        print(f"[Graph] Built: {self.G.number_of_nodes()} nodes, {self.G.number_of_edges()} edges")
        return self

    def _add_headway_edges(self, schedule_df: pd.DataFrame, threshold_min: float = 15.0):
        """Add headway conflict edges between trains at the same station within threshold."""
        # Group by station and op_date
        for (stn, op_date), grp in schedule_df.groupby(["station_code", "op_date"]):
            if len(grp) < 2:
                continue
            grp = grp.sort_values("stop_index").reset_index(drop=True)
            trains = grp["train_number"].tolist()
            for i in range(len(trains)):
                for j in range(i + 1, len(trains)):
                    src = f"EV_{trains[i]}_{stn}_{op_date}"
                    dst = f"EV_{trains[j]}_{stn}_{op_date}"
                    if src in self.G and dst in self.G:
                        self.G.add_edge(src, dst, edge_type="headway_conflict",
                                        weight=0.4, propagation_factor=0.3)

    def inject_disruption(self, train_number: str, delay_minutes: float,
                           op_date: str = None) -> Dict[str, float]:
        """
        Inject a delay disruption into the network and propagate via BFS.
        Returns dict of {event_id: added_delay} for all affected nodes.
        """
        affected = {}
        source_nodes = [
            n for n in self.G.nodes
            if self.G.nodes[n].get("train_number") == train_number
            and (op_date is None or self.G.nodes[n].get("op_date") == op_date)
        ]

        if not source_nodes:
            print(f"[Graph] No nodes found for train {train_number}")
            return affected

        source = source_nodes[0]
        queue = [(source, delay_minutes, 0)]
        visited = set()

        while queue:
            node, delay, hop = queue.pop(0)
            if node in visited or hop > 5:
                continue
            visited.add(node)

            node_data = self.G.nodes.get(node, {})
            if node_data.get("type") == "train_event":
                self.G.nodes[node]["delay_minutes"] = (
                    self.G.nodes[node].get("delay_minutes", 0) + delay
                )
                affected[node] = delay

            for neighbor in self.G.successors(node):
                if neighbor not in visited:
                    edge_data = self.G.edges.get((node, neighbor), {})
                    prop_factor = edge_data.get("propagation_factor", 0.5)
                    propagated_delay = delay * prop_factor
                    if propagated_delay > 0.5:  # threshold: only propagate meaningful delays
                        queue.append((neighbor, propagated_delay, hop + 1))

        print(f"[Graph] Disruption +{delay_minutes:.1f}min on {train_number}: "
              f"{len(affected)} nodes affected over {min(5, len(affected))} hops")
        return affected

    def get_graph_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Compute graph topology features for ML (no leakage — uses historical structure)."""
        df = df.copy()

        # Compute betweenness centrality on station subgraph
        station_nodes = [n for n in self.G.nodes if self.G.nodes[n].get("type") == "station"]
        if len(station_nodes) > 1:
            station_G = self.G.subgraph(station_nodes)
            try:
                bc = nx.betweenness_centrality(station_G, normalized=True)
                self._centrality_cache = bc
            except Exception:
                bc = {n: 0.5 for n in station_nodes}
        else:
            bc = {}

        def get_betweenness(stn):
            node = f"STN_{stn}"
            return bc.get(node, 0.5)

        def get_degree(stn):
            node = f"STN_{stn}"
            return self.G.degree(node) if node in self.G else 1

        df["station_betweenness"] = df["station_code"].apply(get_betweenness)
        df["station_degree"] = df["station_code"].apply(get_degree)

        # Upstream delay (1-hop and 2-hop from previous stop)
        df["upstream_delay_1hop"] = df.get("prev_delay_1", pd.Series(0.0, index=df.index))
        df["upstream_delay_2hop"] = df.get("rolling_delay_3", pd.Series(0.0, index=df.index))

        return df

    def get_affected_entities(self, affected: Dict[str, float]) -> dict:
        """
        Compute impact summary from affected nodes.
        Returns platform conflicts, connection risks, etc.
        """
        affected_trains = set()
        affected_stations = set()
        total_delay = 0.0
        platform_conflicts = 0

        for node_id, delay in affected.items():
            node = self.G.nodes.get(node_id, {})
            if node.get("type") == "train_event":
                affected_trains.add(node.get("train_number", ""))
                affected_stations.add(node.get("station_code", ""))
                total_delay += delay

                # Platform conflict: >1 train at same station in same window
                stn = node.get("station_code", "")
                stn_node = f"STN_{stn}"
                if stn_node in self.G:
                    incoming = list(self.G.predecessors(stn_node))
                    if len(incoming) > 2:
                        platform_conflicts += 1

        return {
            "affected_trains": len(affected_trains),
            "affected_stations": len(affected_stations),
            "total_delay_minutes": round(total_delay, 2),
            "platform_conflicts": platform_conflicts,
            "connection_risk": min(len(affected_trains) * 0.2, 1.0),
        }

    def save(self, path: Path):
        path = Path(path)
        with open(path, "wb") as f:
            pickle.dump(self, f)
        print(f"[Graph] Saved to {path}")

    @staticmethod
    def load(path: Path) -> "RailwayGraph":
        with open(path, "rb") as f:
            return pickle.load(f)
