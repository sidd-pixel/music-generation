import time
from pathlib import Path

import httpx

from app.config import get_settings
from app.utils.helpers import generate_silence, with_retry
from app.utils.logger import get_logger

logger = get_logger("voice_service")
settings = get_settings()

TMP = Path("tmp")


async def generate_voice(
    text: str,
    *,
    mood: str = "",
    mock: bool = False,
    duration: float = 5.0,
) -> bytes:
    """
    Convert lyrics to spoken-word audio via ElevenLabs.
    Falls back to silence if API key missing or mock=True.
    """
    TMP.mkdir(exist_ok=True)
    silence_path = TMP / f"voice_silence_{int(time.time()*1000)}.mp3"

    if mock:
        await generate_silence(silence_path, duration)
        return silence_path.read_bytes()

    if not settings.eleven_api_key:
        logger.warning("ELEVEN_API_KEY not set — returning silent voice placeholder")
        await generate_silence(silence_path, duration)
        return silence_path.read_bytes()

    # Delivery hint prepended to text — ElevenLabs respects these
    mood_hint = f"[{mood.capitalize()} tone, spoken word, slow and poetic] " if mood else "[Spoken word, poetic] "
    payload_text = mood_hint + text

    logger.debug(f"Generating voice for {len(text)} chars of lyrics")

    async def _call() -> bytes:
        async with httpx.AsyncClient(timeout=40) as client:
            resp = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{settings.eleven_voice_id}",
                headers={
                    "xi-api-key": settings.eleven_api_key,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg",
                },
                json={
                    "text": payload_text,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {
                        "stability": 0.45,
                        "similarity_boost": 0.78,
                        "style": 0.3,
                        "use_speaker_boost": True,
                    },
                },
            )
            resp.raise_for_status()
            data = resp.content
            logger.info(f"[voice] Received {len(data):,} bytes from ElevenLabs")
            return data

    return await with_retry(_call, retries=2, delay=1.0, label="ElevenLabs TTS")
