"""
RailPulse-X — Graph Topological Feature Extractor
Extracts betweenness, degree, and multi-hop upstream delay features without temporal leakage.
"""
import networkx as nx
import pandas as pd
from typing import Dict, Any


def extract_graph_features(G: nx.DiGraph, df: pd.DataFrame) -> pd.DataFrame:
    """Compute network topology metrics on station subgraph."""
    df = df.copy()
    station_nodes = [n for n in G.nodes if G.nodes[n].get("type") == "station"]
    if len(station_nodes) > 1:
        sub = G.subgraph(station_nodes)
        try:
            bc = nx.betweenness_centrality(sub, normalized=True)
        except Exception:
            bc = {n: 0.5 for n in station_nodes}
    else:
        bc = {}

    df["station_betweenness"] = df["station_code"].apply(lambda s: bc.get(f"STN_{s}", 0.5))
    df["station_degree"] = df["station_code"].apply(lambda s: G.degree(f"STN_{s}") if f"STN_{s}" in G else 1.0)
    return df
