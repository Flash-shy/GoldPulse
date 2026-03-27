from __future__ import annotations

import enum
import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class OrderSide(str, enum.Enum):
    BUY = "buy"
    SELL = "sell"


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class TradeOrder(Base):
    __tablename__ = "trade_orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    symbol: Mapped[str] = mapped_column(String(16), default="XAUUSD", index=True)
    side: Mapped[str] = mapped_column(String(16))
    quantity_oz: Mapped[Decimal] = mapped_column(Numeric(18, 6))
    status: Mapped[str] = mapped_column(String(16), default=OrderStatus.PENDING.value, index=True)
    limit_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 6))
    average_fill_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 6))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped[User] = relationship(back_populates="orders")
