from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_ENV: str = "development"
    FILE_STORE: str = "./data"
    MAX_UPLOAD_MB: int = 10
    DEFAULT_GENDER: str = "L"
    DATABASE_URL: str = "sqlite:///./sitracking.db"

    class Config:
        env_file = ".env"


settings = Settings()