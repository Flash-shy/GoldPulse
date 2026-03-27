from fastapi import FastAPI

app = FastAPI(
    title="GoldPulse API",
    version="0.1.0",
    description="黄金行情交易应用后端",
)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
