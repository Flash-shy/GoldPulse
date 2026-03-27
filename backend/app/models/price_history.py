from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class PriceHistory(Base):
    __tablename__ = "price_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    symbol: Mapped[str] = mapped_column(String(16), index=True)
    mid: Mapped[Decimal] = mapped_column(Numeric(18, 6))
    bid: Mapped[Decimal | None] = mapped_column(Numeric(18, 6))
    ask: Mapped[Decimal | None] = mapped_column(Numeric(18, 6))
    source: Mapped[str] = mapped_column(String(64))
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
