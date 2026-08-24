"""
RailPulse-X — Pydantic Schemas for Dynamic Multi-Station ETA & Uncertainty
SIH 2026 | PS 26028 Standard
"""
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class StationETA(BaseModel):
    station_code: str
    station_name: str
    distance_km: float
    scheduled_arrival: str
    predicted_eta_p10: str
    predicted_eta_p50: str
    predicted_eta_p90: str
    predicted_delay_p50_min: float
    confidence_window_min: float
    sectional_running_time_min: float
    status: str


class ETAResponse(BaseModel):
    train_id: str
    station_id: str
    scheduled_arrival: Optional[str] = None
    predicted_delay_p10: float
    predicted_delay_p50: float
    predicted_delay_p90: float
    coverage_target: float = 0.90
    interval_width: float
    model_name: str = "RailPulse-X (GATv2 + Residual LightGBM + CQR)"
    upcoming_stations: Optional[List[StationETA]] = None


class JourneyETAResponse(BaseModel):
    train_id: str
    train_name: str
    origin: str
    destination: str
    current_station: str
    current_speed_kmh: float
    current_delay_minutes: float
    zone: str
    weather_condition: str
    coverage_target: float = 0.90
    multi_station_etas: List[StationETA]
    data_source_mode: str = "PROTOTYPE_SYNTHETIC_PROXY (STATISTICALLY CONSTRAINED)"
    reliability_fallback_active: bool = False


class PassengerETAResponse(BaseModel):
    train_number: str
    train_name: str
    destination: str
    next_station: str
    next_station_expected_arrival: str
    confidence_range: str
    expected_delay_min: float
    status: str


class StationDisplayBoard(BaseModel):
    station_code: str
    station_name: str
    timestamp: str
    trains: List[Dict[str, Any]]
