from fastapi import APIRouter
from config import get_settings
from models import HealthResponse
from job_queue import job_queue
from music_service import _audiocraft_available

router = APIRouter()
settings = get_settings()


@router.get("/", response_model=HealthResponse, summary="Server health & service status")
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        services={
            "groq": bool(settings.groq_api_key),
            "elevenlabs": bool(settings.eleven_api_key),
            "musicgen_local": _audiocraft_available(),
            "musicgen_model": settings.musicgen_model,
        },
        queue=job_queue.stats(),
    )
