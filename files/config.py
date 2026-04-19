from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Server
    port: int = 8000
    host: str = "0.0.0.0"
    env: str = "development"

    # Groq
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # ElevenLabs
    eleven_api_key: str = ""
    eleven_voice_id: str = "21m00Tcm4TlvDq8ikWAM"

    # MusicGen
    musicgen_model: str = "facebook/musicgen-small"
    musicgen_duration: float = 10.0
    musicgen_use_gpu: bool = False

    # Concurrency
    max_concurrent_jobs: int = 2
    job_timeout_seconds: int = 180


@lru_cache
def get_settings() -> Settings:
    return Settings()
