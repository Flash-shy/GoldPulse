from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.config import Settings
from app.models import PriceHistory
from app.services.quote_fetcher import SYMBOL_XAUUSD, fetch_xauusd_proxy
from app.services.ws_manager import QuoteConnectionManager

logger = logging.getLogger(__name__)


async def quote_polling_loop(
    session_factory: async_sessionmaker[AsyncSession],
    ws_manager: QuoteConnectionManager,
    settings: Settings,
) -> None:
    while True:
        try:
            q = await fetch_xauusd_proxy(settings)
            async with session_factory() as session:
                row = PriceHistory(
                    symbol=SYMBOL_XAUUSD,
                    mid=q.mid,
                    bid=q.bid,
                    ask=q.ask,
                    source=q.source,
                    recorded_at=datetime.now(timezone.utc),
                )
                session.add(row)
                await session.commit()
                await session.refresh(row)

            await ws_manager.broadcast_json(
                {
                    "type": "quote",
                    "symbol": SYMBOL_XAUUSD,
                    "mid": str(q.mid),
                    "bid": str(q.bid),
                    "ask": str(q.ask),
                    "source": q.source,
                    "recorded_at": row.recorded_at.isoformat(),
                }
            )
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("quote tick failed")
        await asyncio.sleep(settings.quote_poll_interval_sec)
