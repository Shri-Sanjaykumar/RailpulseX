"""
RailPulse-X — Database Models (SQLAlchemy)
Stores historical disruptions, simulated interventions, and evaluation logs.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class DisruptionLog(Base):
    __tablename__ = "disruptions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    train_number = Column(String(50), nullable=False, index=True)
    station_code = Column(String(20), nullable=False)
    injected_delay_min = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    conformal_p10 = Column(Float)
    conformal_p50 = Column(Float)
    conformal_p90 = Column(Float)
    affected_trains_count = Column(Integer)
    affected_stations_count = Column(Integer)
    recommended_action = Column(String(100))
    j_no_action = Column(Float)
    j_recommended = Column(Float)
    avoided_disruption = Column(Float)
    improvement_pct = Column(Float)
    verification_status = Column(String(50))
    scenario_details = Column(JSON)
