from __future__ import annotations

import logging
import random
from decimal import Decimal
from typing import NamedTuple

import httpx

from app.config import Settings

logger = logging.getLogger(__name__)

SYMBOL_XAUUSD = "XAUUSD"


class FetchedQuote(NamedTuple):
    mid: Decimal
    bid: Decimal
    ask: Decimal
    source: str


async def fetch_xauusd_proxy(settings: Settings) -> FetchedQuote:
    """
    Prefer Binance PAXG/USDT as a liquid proxy for gold USD price.
    Falls back to a simulated XAU/USD mid when the network or API fails.
    """
    url = "https://api.binance.com/api/v3/ticker/price"
    source = "simulated_xauusd"
    mid: Decimal

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(8.0)) as client:
            r = await client.get(url, params={"symbol": settings.quote_binance_symbol})
            r.raise_for_status()
            data = r.json()
            mid = Decimal(str(data["price"]))
            source = "binance_paxg"
    except Exception as exc:  # noqa: BLE001
        logger.warning("Binance quote failed (%s), using simulated XAU/USD", exc)
        base = Decimal(settings.simulated_xauusd_mid)
        jitter = Decimal(str(round(random.uniform(-0.75, 0.75), 4)))
        mid = base + jitter

    spread = mid * Decimal("0.00015")
    half = spread / Decimal("2")
    bid = mid - half
    ask = mid + half

    return FetchedQuote(mid=mid, bid=bid, ask=ask, source=source)
