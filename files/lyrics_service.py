import httpx

from app.config import get_settings
from app.utils.helpers import with_retry
from app.utils.logger import get_logger
from app.utils.prompt_builder import build_lyrics_prompt

logger = get_logger("lyrics_service")
settings = get_settings()


async def generate_lyrics(
    *,
    mood: str,
    genre: str,
    energy: str = "medium",
    theme: str = "",
) -> str:
    if not settings.groq_api_key:
        logger.warning("GROQ_API_KEY not set — returning placeholder lyrics")
        return (
            f"[Verse 1]\nA {mood} {genre} song begins\nRising like the morning sun\n\n"
            f"[Chorus]\nEchoes fill the evening air\nFading where the river runs\n\n"
            f"[Verse 2]\nSilence holds the melody\nUntil the song is done"
        )

    prompt = build_lyrics_prompt(mood=mood, genre=genre, energy=energy, theme=theme)
    logger.debug(f"Generating lyrics: mood={mood} genre={genre} energy={energy}")

    async def _call() -> str:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.groq_api_key}"},
                json={
                    "model": settings.groq_model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 400,
                    "temperature": 0.85,
                },
            )
            resp.raise_for_status()
            lyrics = resp.json()["choices"][0]["message"]["content"].strip()
            if not lyrics:
                raise ValueError("Empty lyrics response from Groq")
            logger.info(f"Lyrics generated ({len(lyrics)} chars)")
            return lyrics

    return await with_retry(_call, retries=3, delay=0.8, label="Groq lyrics")
