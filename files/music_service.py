import asyncio
import time
from functools import lru_cache
from pathlib import Path

from config import get_settings
from helpers import generate_silence
from logger import get_logger

logger = get_logger("music_service")
settings = get_settings()

TMP = Path("tmp")


# ── audiocraft availability check ────────────────────────────────────────────

@lru_cache(maxsize=1)
def _audiocraft_available() -> bool:
    try:
        import audiocraft  # noqa: F401
        import torch        # noqa: F401
        return True
    except ImportError as e:
        logger.warning(
            f"audiocraft not available ({e}). Music will be silent placeholders. "
            "Install with: pip install audiocraft torch torchaudio"
        )
        return False


# ── Model cache — load once, reuse ───────────────────────────────────────────

_model_cache: dict = {}


def _load_model(model_name: str, use_gpu: bool):
    """Load and cache MusicGen model. Called inside a thread."""
    if model_name in _model_cache:
        return _model_cache[model_name]

    from audiocraft.models import MusicGen
    import torch

    device = "cuda" if (use_gpu and torch.cuda.is_available()) else "cpu"
    logger.info(f"Loading MusicGen model '{model_name}' on {device} (first run only)...")
    t0 = time.time()
    model = MusicGen.get_pretrained(model_name)
    model.to(device)
    logger.info(f"Model loaded in {time.time() - t0:.1f}s")
    _model_cache[model_name] = model
    return model


# ── Core generation (blocking, runs in thread pool) ──────────────────────────

def _generate_blocking(prompt: str, output_path: Path, duration: float) -> Path:
    from audiocraft.data.audio import audio_write
    import torch

    model = _load_model(settings.musicgen_model, settings.musicgen_use_gpu)
    model.set_generation_params(duration=duration)

    logger.info(f"[musicgen] Generating {duration}s | prompt: {prompt!r}")
    t0 = time.time()

    with torch.inference_mode():
        wav = model.generate([prompt])  # (1, channels, samples)

    logger.info(f"[musicgen] Generation done in {time.time() - t0:.1f}s")

    # audio_write appends .wav automatically — pass stem only
    stem = str(output_path).removesuffix(".wav").removesuffix(".mp3")
    audio_write(
        stem,
        wav[0].cpu(),
        model.sample_rate,
        strategy="loudness",
        loudness_compressor=True,
    )
    return Path(stem + ".wav")


# ── Public async API ──────────────────────────────────────────────────────────

async def generate_music(
    prompt: str,
    *,
    mock: bool = False,
    duration: float | None = None,
) -> bytes:
    """
    Generate music and return raw audio bytes.
    Uses local MusicGen (audiocraft). Falls back to silent MP3 if unavailable.
    """
    dur = duration if duration is not None else settings.musicgen_duration
    TMP.mkdir(exist_ok=True)
    silence_path = TMP / f"silence_{int(time.time()*1000)}.mp3"

    if mock:
        await generate_silence(silence_path, dur)
        return silence_path.read_bytes()

    if not _audiocraft_available():
        await generate_silence(silence_path, dur)
        return silence_path.read_bytes()

    out_stem = TMP / f"music_{int(time.time()*1000)}"

    try:
        # Run blocking inference in a thread so the event loop stays responsive
        loop = asyncio.get_running_loop()
        out_path = await loop.run_in_executor(
            None, _generate_blocking, prompt, out_stem, dur
        )
        if out_path.exists():
            logger.info(f"[musicgen] Saved to {out_path}")
            return out_path.read_bytes()
        raise FileNotFoundError(f"Output not found: {out_path}")

    except Exception as exc:
        logger.error(f"[musicgen] Failed: {exc} — falling back to silence")
        await generate_silence(silence_path, dur)
        return silence_path.read_bytes()
