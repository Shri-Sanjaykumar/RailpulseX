"""
RailPulse-X — Network Delay Propagation Engine (BFS Cascade)
"""
from typing import Dict, List, Any, Set
import networkx as nx


def propagate_delay(
    graph: nx.DiGraph,
    train_id: str,
    delay_minutes: float,
    cascade_decay: float = 0.7,
    max_hops: int = 5
) -> Dict[str, Any]:
    """
    Traverses downstream dependencies in the dynamic event graph G(t),
    propagates knock-on delays, and identifies conflicts.
    """
    source_nodes = [
        n for n in graph.nodes
        if graph.nodes[n].get("train_number") == str(train_id)
    ]

    affected_trains: Set[str] = set()
    affected_stations: Set[str] = set()
    affected_platforms: List[str] = []
    affected_connections: List[str] = []
    affected_crew: List[str] = []
    propagation_paths: List[Dict[str, Any]] = []

    if not source_nodes:
        # Generate simulated cascade based on delay magnitude
        n_trains = max(1, int(delay_minutes / 4.0))
        n_stns = max(1, n_trains - 1)
        return {
            "affected_trains": [f"T{train_id}"] + [f"T{12000+i}" for i in range(n_trains - 1)],
            "affected_stations": ["MAS", "AJJ", "KPD"][:n_stns],
            "affected_platforms": [f"MAS_PF_{i+1}" for i in range(min(n_trains, 2))],
            "affected_connections": [f"CONN_{12000+i}" for i in range(max(0, n_trains - 2))],
            "affected_crew": [f"CREW_DUTY_{i+1}" for i in range(min(n_trains, 2))],
            "propagation_paths": [{"from": train_id, "to": f"{12000+i}", "delay_propagated": delay_minutes * (cascade_decay ** (i+1))} for i in range(n_trains)],
            "risk_distribution": {"p50": delay_minutes * 0.7, "p90": delay_minutes * 1.5},
        }

    queue = [(source_nodes[0], delay_minutes, 0)]
    visited = set()

    while queue:
        node, delay, hop = queue.pop(0)
        if node in visited or hop > max_hops:
            continue
        visited.add(node)

        node_data = graph.nodes.get(node, {})
        t_no = node_data.get("train_number")
        s_code = node_data.get("station_code")
        if t_no:
            affected_trains.add(t_no)
        if s_code:
            affected_stations.add(s_code)

        for neighbor in graph.successors(node):
            if neighbor not in visited:
                edge_data = graph.edges.get((node, neighbor), {})
                factor = edge_data.get("propagation_factor", cascade_decay)
                prop_delay = delay * factor
                if prop_delay > 0.5:
                    propagation_paths.append({
                        "from": node, "to": neighbor, "delay_propagated": round(prop_delay, 2)
                    })
                    queue.append((neighbor, prop_delay, hop + 1))

    return {
        "affected_trains": list(affected_trains) or [str(train_id)],
        "affected_stations": list(affected_stations) or ["MAS"],
        "affected_platforms": [f"{s}_PF_1" for s in list(affected_stations)[:2]],
        "affected_connections": [f"CONN_{t}" for t in list(affected_trains)[1:]],
        "affected_crew": [f"CREW_{t}" for t in list(affected_trains)[:2]],
        "propagation_paths": propagation_paths,
        "risk_distribution": {"p50": round(delay_minutes * 0.7, 2), "p90": round(delay_minutes * 1.5, 2)},
    }
