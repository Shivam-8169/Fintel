import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = "Fintel"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = Field(
        default="sqlite:///./fintel.db",
        description="Database connection URI"
    )

    # Authentication & JWT
    JWT_SECRET: str = "fintel-dev-secret-key-super-secure-for-academic-demo-32-chars-min"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    # LLM Settings
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gemini-1.5-flash"
    LLM_BASE_URL: str = ""
    DEMO_MODE: bool = True

    # Detection & Risk Thresholds
    DETECTION_THRESHOLD: float = 60.0
    RAPID_MOVEMENT_WINDOW_HOURS: int = 24
    HIGH_VALUE_THRESHOLD: float = 50000.0
    STRUCTURING_THRESHOLD: float = 9500.0
    STRUCTURING_LOWER_BOUND: float = 8000.0
    HIGH_VELOCITY_TX_COUNT: int = 5
    HIGH_VELOCITY_WINDOW_HOURS: int = 12
    FAN_OUT_IN_DEGREE_THRESHOLD: int = 4


settings = Settings()
