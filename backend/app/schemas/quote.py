from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class QuoteLatestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    symbol: str
    mid: Decimal
    bid: Decimal | None
    ask: Decimal | None
    source: str
    recorded_at: datetime


class PriceHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(description="UUID as string")
    symbol: str
    mid: Decimal
    bid: Decimal | None
    ask: Decimal | None
    source: str
    recorded_at: datetime
