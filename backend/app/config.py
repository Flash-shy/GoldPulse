from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/goldpulse"
    quote_poll_interval_sec: float = 3.0
    # Browsers require the page origin here for fetch() / XHR (GitHub Pages + custom domain).
    # Override entirely with env JSON if needed: CORS_ORIGINS='["https://your.com"]'
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://flash-shy.github.io",
        "https://goldpulse.sunhaoyang.net",
    ]
    # PAXG/USDT tracks physical gold; used as a live proxy for XAU/USD when available.
    quote_binance_symbol: str = "PAXGUSDT"
    simulated_xauusd_mid: str = "2650.00"


@lru_cache
def get_settings() -> Settings:
    return Settings()
