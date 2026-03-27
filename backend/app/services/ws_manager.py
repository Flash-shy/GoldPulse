import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class QuoteConnectionManager:
    """Broadcasts JSON messages to all connected quote WebSocket clients."""

    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()

    @property
    def connection_count(self) -> int:
        return len(self._connections)

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self._connections.discard(websocket)

    async def broadcast_json(self, payload: dict[str, Any]) -> None:
        text = json.dumps(payload, default=str)
        dead: list[WebSocket] = []
        for ws in self._connections:
            try:
                await ws.send_text(text)
            except Exception as exc:  # noqa: BLE001 — drop broken clients
                logger.debug("websocket send failed: %s", exc)
                dead.append(ws)
        for ws in dead:
            self._connections.discard(ws)
