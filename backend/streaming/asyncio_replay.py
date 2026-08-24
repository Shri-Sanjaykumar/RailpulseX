"""
RailPulse-X — Asyncio Event Replay Engine
Replays historical/simulated timetable events over WebSocket without Kafka dependency.
"""
import asyncio
import json
import logging
from pathlib import Path
from typing import Callable, List, Optional
import pandas as pd

logger = logging.getLogger("railpulse-x.replay")
BASE = Path(__file__).parent.parent.parent


class AsyncReplayEngine:
    def __init__(self, data_path: Optional[Path] = None, speedup: float = 10.0):
        self.data_path = data_path or (BASE / "data" / "processed" / "test.parquet")
        self.speedup = speedup
        self._is_running = False
        self._callbacks: List[Callable] = []

    def subscribe(self, callback: Callable):
        self._callbacks.append(callback)

    async def start(self):
        if not self.data_path.exists():
            logger.warning(f"Replay data not found at {self.data_path}")
            return

        self._is_running = True
        df = pd.read_parquet(self.data_path).head(500)
        logger.info(f"Starting event replay of {len(df)} events at {self.speedup}x speed")

        for _, row in df.iterrows():
            if not self._is_running:
                break

            event = {
                "train_number": str(row.get("train_number", "")),
                "station_code": str(row.get("station_code", "")),
                "timestamp": str(row.get("timestamp", "")),
                "delay_minutes": float(row.get("delay_minutes", 0.0)),
                "is_peak_hour": int(row.get("is_peak_hour", 0)),
                "train_priority": float(row.get("train_priority", 0.5)),
            }

            for cb in self._callbacks:
                try:
                    await cb(event)
                except Exception as e:
                    logger.debug(f"Callback error: {e}")

            # Sleep between events (scaled by speedup)
            await asyncio.sleep(1.0 / self.speedup)

        logger.info("Replay completed.")

    def stop(self):
        self._is_running = False
