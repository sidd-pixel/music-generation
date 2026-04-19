_ENERGY_MAP = {
    "low":    "slow, sparse, minimal arrangement",
    "medium": "moderate pace, balanced instrumentation",
    "high":   "fast, energetic, driving rhythm",
}

_MOOD_MAP = {
    "happy":      "uplifting, bright, major key",
    "sad":        "melancholic, minor key, introspective",
    "angry":      "intense, distorted, powerful",
    "calm":       "peaceful, ambient, soothing",
    "romantic":   "warm, lush, intimate",
    "mysterious": "dark, atmospheric, suspenseful",
    "epic":       "cinematic, orchestral, grand",
}


def build_music_prompt(
    *,
    mood: str,
    genre: str,
    energy: str = "medium",
    instruments: str = "",
    tempo: str = "",
) -> str:
    mood_desc = _MOOD_MAP.get(mood.lower(), mood)
    energy_desc = _ENERGY_MAP.get(energy.lower(), energy)
    instrument_hint = f" Featuring {instruments}." if instruments else ""
    tempo_hint = f" Tempo: {tempo}." if tempo else ""

    return (
        f"{mood_desc} {genre} music. {energy_desc}.{instrument_hint}{tempo_hint} "
        "High quality, studio recording, no vocals, cinematic feel."
    ).strip()


def build_lyrics_prompt(*, mood: str, genre: str, energy: str = "medium", theme: str = "") -> str:
    theme_hint = f"Theme/topic: {theme}." if theme else ""
    return f"""You are a professional songwriter. Write a {mood}, {energy}-energy {genre} song.
{theme_hint}
Requirements:
- 2 short verses (2–3 lines each) and 1 chorus (2–3 lines)
- Label each section: [Verse 1], [Chorus], [Verse 2]
- Vivid, evocative language matching the mood
- No explanations, no titles — just the labeled lyrics"""
