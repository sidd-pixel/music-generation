import time
import uuid
from pathlib import Path

from fastapi import APIRouter, Header, Query, HTTPException, Request
from fastapi.responses import FileResponse

from models import GenerateRequest, GenerateResponse, ErrorResponse
from lyrics_service import generate_lyrics
from music_service import generate_music
from voice_service import generate_voice
from merge_service import merge_audio
from helpers import validate_input
from prompt_builder import build_music_prompt
from job_queue import job_queue
from logger import get_logger

router = APIRouter()
logger = get_logger("route.generate")

TMP = Path("music")


@router.post(
    "/",
    response_model=GenerateResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Generate an AI song",
    description=(
        "Generates lyrics (Groq), background music (local MusicGen), and a spoken-word "
        "voice track (ElevenLabs), then merges them into a single MP3."
    ),
)
async def generate(
    body: GenerateRequest,
    mock: bool = Query(False, description="Skip real APIs, return silent audio (dev mode)"),
    x_mock: str = Header(None, alias="x-mock"),
) -> GenerateResponse:
    job_id = str(uuid.uuid4())
    is_mock = mock or x_mock == "1"

    logger.info(
        f"[{job_id}] Request: mood={body.mood!r} genre={body.genre!r} "
        f"energy={body.energy} mock={is_mock}"
    )

    if not is_mock:
        try:
            validate_input(body.mood, body.genre)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    async def _run():
        job_tmp = TMP / job_id
        job_tmp.mkdir(parents=True, exist_ok=True)

        # ── Step 1: Lyrics ─────────────────────────────────────────────
        logger.info(f"[{job_id}] 1/4 Generating lyrics...")
        if is_mock:
            lyrics = (
                f"[Verse 1]\nA {body.mood} {body.genre} song begins\n"
                "Words drift like morning fog\n\n"
                "[Chorus]\nEchoes fill the evening air\n"
                "Fading where the river runs\n\n"
                "[Verse 2]\nSilence holds the melody\n"
                "Until the final note is done"
            )
        else:
            lyrics = await generate_lyrics(
                mood=body.mood, genre=body.genre,
                energy=body.energy, theme=body.theme,
            )

        # ── Step 2: Music (local MusicGen) ─────────────────────────────
        logger.info(f"[{job_id}] 2/4 Generating music...")
        music_prompt = build_music_prompt(
            mood=body.mood, genre=body.genre,
            energy=body.energy, instruments=body.instruments, tempo=body.tempo,
        )
        music_bytes = await generate_music(
            music_prompt, mock=is_mock, duration=body.duration
        )
        music_path = job_tmp / "music.wav"
        music_path.write_bytes(music_bytes)

        # ── Step 3: Voice (ElevenLabs) ─────────────────────────────────
        logger.info(f"[{job_id}] 3/4 Generating voice...")
        voice_bytes = await generate_voice(
            lyrics, mood=body.mood, mock=is_mock
        )
        voice_path = job_tmp / "voice.mp3"
        voice_path.write_bytes(voice_bytes)

        # ── Step 4: Merge ──────────────────────────────────────────────
        logger.info(f"[{job_id}] 4/4 Merging audio...")
        output_path = job_tmp / "final.mp3"
        await merge_audio(music_path, voice_path, output_path)

        return {"lyrics": lyrics, "output_path": output_path}

    try:
        t0 = time.time()
        result = await job_queue.enqueue(job_id, _run)
        elapsed = round(time.time() - t0, 2)

        return GenerateResponse(
            success=True,
            job_id=job_id,
            lyrics=result["lyrics"],
            audio_file=str(result["output_path"]),
            duration_seconds=elapsed,
            message=f"Generated in {elapsed}s. Download at /generate/audio/{job_id}",
        )
    except TimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        logger.exception(f"[{job_id}] Generation failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/audio/{job_id}",
    summary="Download the generated MP3",
    response_class=FileResponse,
)
async def download_audio(job_id: str):
    # Sanitise job_id — must be a UUID
    import re
    if not re.match(r"^[0-9a-f\-]{36}$", job_id):
        raise HTTPException(status_code=400, detail="Invalid job_id")

    audio_path = TMP / job_id / "final.mp3"
    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="Audio not found for this job_id")

    return FileResponse(
        path=str(audio_path),
        media_type="audio/mpeg",
        filename=f"song_{job_id[:8]}.mp3",
    )
