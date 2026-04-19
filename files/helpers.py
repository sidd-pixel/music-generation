import asyncio
import re
import subprocess
from pathlib import Path
from typing import Any, Callable, Coroutine

from logger import get_logger

logger = get_logger("helpers")


# ── Input validation ──────────────────────────────────────────────────────────

_SAFE = re.compile(r"^[a-zA-Z0-9 \-_]+$")


def validate_input(mood: str, genre: str) -> None:
    if not mood or not mood.strip():
        raise ValueError("Missing required field: mood")
    if not genre or not genre.strip():
        raise ValueError("Missing required field: genre")
    if not _SAFE.match(mood):
        raise ValueError("mood contains invalid characters")
    if not _SAFE.match(genre):
        raise ValueError("genre contains invalid characters")


# ── Silent audio placeholder ──────────────────────────────────────────────────

async def generate_silence(output_path: Path, duration: float = 3.0) -> Path:
    """Create a silent MP3 via ffmpeg. Falls back to empty file on failure."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi",
        "-i", "anullsrc=r=44100:cl=stereo",
        "-t", str(duration),
        "-q:a", "9",
        "-acodec", "libmp3lame",
        str(output_path),
    ]
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd, stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL
        )
        await proc.wait()
        logger.debug(f"Silent placeholder: {output_path} ({duration}s)")
    except Exception as e:
        logger.warning(f"ffmpeg silence failed ({e}), writing empty file")
        output_path.write_bytes(b"")
    return output_path


# ── Retry ─────────────────────────────────────────────────────────────────────

async def with_retry(
    fn: Callable[[], Coroutine[Any, Any, Any]],
    *,
    retries: int = 3,
    delay: float = 1.0,
    label: str = "operation",
) -> Any:
    last_err: Exception = RuntimeError("No attempts made")
    for attempt in range(1, retries + 1):
        try:
            return await fn()
        except Exception as exc:
            last_err = exc
            logger.warning(f"{label} attempt {attempt}/{retries} failed: {exc}")
            if attempt < retries:
                await asyncio.sleep(delay * attempt)
    raise last_err


# ── Timeout ───────────────────────────────────────────────────────────────────

async def with_timeout(coro: Coroutine, seconds: float, label: str = "operation") -> Any:
    try:
        return await asyncio.wait_for(coro, timeout=seconds)
    except asyncio.TimeoutError:
        raise TimeoutError(f"{label} timed out after {seconds}s")
