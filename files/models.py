from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator


class GenerateRequest(BaseModel):
    mood: str = Field(..., min_length=1, max_length=50, examples=["melancholic", "happy", "epic"])
    genre: str = Field(..., min_length=1, max_length=50, examples=["jazz", "lo-fi", "cinematic"])
    energy: Literal["low", "medium", "high"] = "medium"
    theme: str = Field(default="", max_length=200, description="Optional lyrical theme, e.g. 'lost love'")
    instruments: str = Field(default="", max_length=200, description="e.g. 'piano, cello, soft drums'")
    tempo: str = Field(default="", max_length=50, description="e.g. '80 BPM' or 'slow'")
    duration: Optional[float] = Field(default=None, ge=3.0, le=30.0, description="Music length in seconds")

    @field_validator("mood", "genre")
    @classmethod
    def no_special_chars(cls, v: str) -> str:
        import re
        if not re.match(r"^[a-zA-Z0-9 \-_]+$", v):
            raise ValueError("Only alphanumeric characters, spaces, hyphens, and underscores allowed")
        return v.strip()


class GenerateResponse(BaseModel):
    success: bool
    job_id: str
    lyrics: str
    audio_file: str
    duration_seconds: float
    message: str


class ErrorResponse(BaseModel):
    error: str
    job_id: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    services: dict
    queue: dict
