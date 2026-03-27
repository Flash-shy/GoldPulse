from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.models import PriceHistory
from app.schemas.quote import PriceHistoryItem, QuoteLatestResponse

router = APIRouter(prefix="/quotes", tags=["quotes"])


@router.get("/latest", response_model=QuoteLatestResponse)
async def get_latest_quote(session: AsyncSession = Depends(get_session)) -> QuoteLatestResponse:
    stmt = select(PriceHistory).order_by(PriceHistory.recorded_at.desc()).limit(1)
    row = (await session.execute(stmt)).scalar_one_or_none()
    if row is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="No price ticks yet; wait for the quote worker.")
    return QuoteLatestResponse.model_validate(row)


@router.get("/history", response_model=list[PriceHistoryItem])
async def list_price_history(
    session: AsyncSession = Depends(get_session),
    limit: int = Query(default=100, ge=1, le=500),
) -> list[PriceHistoryItem]:
    stmt = select(PriceHistory).order_by(PriceHistory.recorded_at.desc()).limit(limit)
    rows = (await session.execute(stmt)).scalars().all()
    return [
        PriceHistoryItem(
            id=str(r.id),
            symbol=r.symbol,
            mid=r.mid,
            bid=r.bid,
            ask=r.ask,
            source=r.source,
            recorded_at=r.recorded_at,
        )
        for r in rows
    ]
