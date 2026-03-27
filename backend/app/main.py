from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers.quotes import router as quotes_router
from app.config import get_settings
from app.database import AsyncSessionLocal, init_db
from app.services.quote_worker import quote_polling_loop
from app.services.ws_manager import QuoteConnectionManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    await init_db()
    ws_manager = QuoteConnectionManager()
    app.state.quote_ws_manager = ws_manager
    task = asyncio.create_task(quote_polling_loop(AsyncSessionLocal, ws_manager, settings))
    app.state.quote_task = task
    logger.info("Quote polling started (interval=%ss)", settings.quote_poll_interval_sec)
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    logger.info("Quote polling stopped")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="GoldPulse API",
        version="0.2.0",
        description="黄金行情交易应用后端 — 行情接入与 WebSocket 推送",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(quotes_router, prefix="/api/v1")

    @app.get("/health", tags=["system"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.websocket("/ws/quotes")
    async def quotes_websocket(websocket: WebSocket) -> None:
        manager: QuoteConnectionManager = websocket.app.state.quote_ws_manager
        await manager.connect(websocket)
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            pass
        finally:
            manager.disconnect(websocket)

    return app


app = create_app()
