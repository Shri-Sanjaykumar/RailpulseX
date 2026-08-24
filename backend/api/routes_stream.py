"""
RailPulse-X — Routes: WebSocket Live Event Streaming
Endpoint: WS /stream
"""
import asyncio
import json
import time
import logging
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger("railpulse-x.stream")
router = APIRouter(tags=["Streaming"])

CONNECTED_CLIENTS: List[WebSocket] = []


@router.websocket("/stream")
async def websocket_stream(websocket: WebSocket):
    """Real-time event and state stream for live dashboard updates."""
    await websocket.accept()
    CONNECTED_CLIENTS.append(websocket)
    try:
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "message": "RailPulse-X WebSocket connected",
            "timestamp": time.time()
        })
        while True:
            await asyncio.sleep(2.0)
            await websocket.send_json({
                "type": "HEARTBEAT",
                "timestamp": time.time()
            })
    except (WebSocketDisconnect, Exception):
        if websocket in CONNECTED_CLIENTS:
            CONNECTED_CLIENTS.remove(websocket)


async def broadcast_event(event_type: str, data: dict):
    """Broadcast state change event to all connected WebSocket clients."""
    disconnected = []
    for client in CONNECTED_CLIENTS:
        try:
            await client.send_json({"type": event_type, "data": data, "timestamp": time.time()})
        except Exception:
            disconnected.append(client)
    for client in disconnected:
        CONNECTED_CLIENTS.remove(client)
