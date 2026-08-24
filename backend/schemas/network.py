"""
RailPulse-X — Pydantic Schemas for Network State, Stations, and Trains
"""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class TrainState(BaseModel):
    train_number: str
    train_name: str
    current_station: str
    delay_minutes: float
    status: str
    priority: float


class StationState(BaseModel):
    station_code: str
    station_name: Optional[str] = ""
    lat: float
    lon: float
    zone: str
    delay_index: float


class NetworkMetrics(BaseModel):
    total_active_trains: int
    delayed_trains_count: int
    average_system_delay_min: float
    platform_conflicts_count: int
    system_health_score: float
