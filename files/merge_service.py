import asyncio
from pathlib import Path

from logger import get_logger

logger = get_logger("merge_service")


async def merge_audio(music_path: Path, voice_path: Path, output_path: Path) -> Path:
    """
    Merge background music + voice with professional mixing:
    - Music ducked to 25% volume (-12 dB) under the voice
    - Voice sits clearly on top at full volume
    - Output duration = longest of the two tracks
    - 192kbps stereo MP3 output
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)

    filter_graph = (
        "[0:a]volume=0.25[music_low];"
        "[music_low][1:a]amix=inputs=2:duration=longest:dropout_transition=2[out]"
    )

    cmd = [
        "ffmpeg", "-y",
        "-i", str(music_path),
        "-i", str(voice_path),
        "-filter_complex", filter_graph,
        "-map", "[out]",
        "-ar", "44100",
        "-ab", "192k",
        "-f", "mp3",
        str(output_path),
    ]

    logger.debug(f"[merge] {music_path.name} + {voice_path.name} → {output_path.name}")

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()

    if proc.returncode != 0:
        err = stderr.decode(errors="replace").strip()
        raise RuntimeError(f"ffmpeg merge failed (exit {proc.returncode}): {err}")

    logger.info(f"[merge] Done → {output_path}")
    return output_path
