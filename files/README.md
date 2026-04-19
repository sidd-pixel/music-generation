# 🎵 AI Music Generator — Python Server

A fully local, production-ready AI music generation server.  
**Groq** writes the lyrics → **Local MusicGen** composes the music → **ElevenLabs** speaks the lyrics → **ffmpeg** mixes everything into a final MP3.

---

## Architecture

```
POST /generate
      │
      ├─ 1. Lyrics      → Groq (llama-3.3-70b)          [cloud, free tier]
      ├─ 2. Music       → Meta MusicGen (audiocraft)     [100% local]
      ├─ 3. Voice       → ElevenLabs TTS                 [cloud, free tier]
      └─ 4. Merge       → ffmpeg (voice ducking mix)     [local]
```

---

## Requirements

| Tool | Min version |
|------|-------------|
| Python | 3.10+ |
| ffmpeg | any recent |
| pip | 23+ |
| RAM | 4 GB (small model) / 8 GB (medium) |
| GPU | Optional — CPU works fine for `musicgen-small` |

---

## Quick Start

### 1. Clone / copy the project

```bash
cd music-generator-py
```

### 2. Create a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
```

### 3. Install Python dependencies

**CPU (recommended for local dev):**
```bash
pip install torch torchaudio --extra-index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```

**GPU (CUDA 11.8):**
```bash
pip install torch torchaudio --extra-index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt
```

### 4. Install ffmpeg

```bash
# macOS
brew install ffmpeg

# Ubuntu / Debian
sudo apt install ffmpeg

# Windows (chocolatey)
choco install ffmpeg
```

### 5. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your keys:

```env
GROQ_API_KEY=gsk_...          # https://console.groq.com
ELEVEN_API_KEY=sk_...         # https://elevenlabs.io
```

Everything else has sensible defaults. The server works without API keys — it returns silent audio placeholders so you can test the pipeline locally.

### 6. Run

```bash
python main.py
```

Server starts at **http://localhost:8000**  
Interactive API docs at **http://localhost:8000/docs**

---

## API Reference

### `POST /generate`

Generate a full song (lyrics + music + voice, merged).

**Request body:**

```json
{
  "mood":        "melancholic",
  "genre":       "jazz",
  "energy":      "low",
  "theme":       "lost love in the rain",
  "instruments": "piano, double bass, brushed drums",
  "tempo":       "60 BPM",
  "duration":    12
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mood` | string | ✅ | e.g. `happy`, `sad`, `epic`, `mysterious` |
| `genre` | string | ✅ | e.g. `jazz`, `lo-fi`, `cinematic`, `hip-hop` |
| `energy` | `low`\|`medium`\|`high` | — | Default: `medium` |
| `theme` | string | — | Lyrical theme hint |
| `instruments` | string | — | Instrumentation hint for MusicGen |
| `tempo` | string | — | Tempo hint e.g. `80 BPM` |
| `duration` | float (3–30) | — | Music length in seconds. Default: `MUSICGEN_DURATION` env var |

**Response:**

```json
{
  "success": true,
  "job_id": "a3f1c2d4-...",
  "lyrics": "[Verse 1]\n...\n[Chorus]\n...",
  "audio_file": "tmp/a3f1c2d4-.../final.mp3",
  "duration_seconds": 47.3,
  "message": "Generated in 47.3s. Download at /generate/audio/a3f1c2d4-..."
}
```

---

### `GET /generate/audio/{job_id}`

Download the generated MP3.

```bash
curl http://localhost:8000/generate/audio/<job_id> -o song.mp3
```

---

### `GET /health`

Check which services are configured and live.

```json
{
  "status": "ok",
  "services": {
    "groq": true,
    "elevenlabs": true,
    "musicgen_local": true,
    "musicgen_model": "facebook/musicgen-small"
  },
  "queue": {
    "total": 3,
    "queued": 0,
    "running": 1,
    "done": 2,
    "failed": 0
  }
}
```

---

## Dev / Mock Mode

Skip all external APIs and get a fast silent-audio response for testing the pipeline:

```bash
# Query param
curl -X POST "http://localhost:8000/generate?mock=true" \
  -H "Content-Type: application/json" \
  -d '{"mood": "happy", "genre": "pop"}'

# Header
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -H "x-mock: 1" \
  -d '{"mood": "happy", "genre": "pop"}'
```

---

## Example cURL (full run)

```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "mood": "melancholic",
    "genre": "cinematic",
    "energy": "low",
    "theme": "an astronaut drifting alone",
    "instruments": "strings, piano, ambient synth",
    "duration": 15
  }' | jq .
```

Then download:

```bash
curl http://localhost:8000/generate/audio/<job_id> -o output.mp3
```

---

## MusicGen Model Options

| Model | Size | Quality | RAM | Speed (CPU) |
|-------|------|---------|-----|-------------|
| `facebook/musicgen-small` | 300 MB | Good | ~4 GB | ~30–60s |
| `facebook/musicgen-medium` | 1.5 GB | Better | ~8 GB | ~2–4 min |
| `facebook/musicgen-large` | 3.3 GB | Best | ~16 GB | ~5–10 min |
| `facebook/musicgen-melody` | 1.5 GB | Good + melody conditioning | ~8 GB | ~2–4 min |

Set in `.env`:
```env
MUSICGEN_MODEL=facebook/musicgen-small
MUSICGEN_DURATION=10
MUSICGEN_USE_GPU=false
```

The model is downloaded from HuggingFace on **first run only** and cached locally at `~/.cache/huggingface/`.

---

## Project Structure

```
music-generator-py/
├── main.py                    # Entry point — uvicorn server
├── requirements.txt
├── .env.example
│
├── app/
│   ├── app.py                 # FastAPI factory, middleware, lifespan
│   ├── config.py              # Pydantic settings (reads .env)
│   ├── models.py              # Request / response schemas
│   │
│   ├── routes/
│   │   ├── generate.py        # POST /generate, GET /generate/audio/{id}
│   │   └── health.py          # GET /health
│   │
│   ├── services/
│   │   ├── lyrics_service.py  # Groq → lyrics
│   │   ├── music_service.py   # Local MusicGen (audiocraft) → WAV
│   │   ├── voice_service.py   # ElevenLabs → spoken MP3
│   │   └── merge_service.py   # ffmpeg → final mixed MP3
│   │
│   └── utils/
│       ├── helpers.py         # validate_input, generate_silence, with_retry
│       ├── logger.py          # Winston-style structured logging
│       ├── prompt_builder.py  # Rich prompt construction for MusicGen + Groq
│       └── queue.py           # Async semaphore job queue
│
├── tmp/                       # Per-job audio files (auto-created)
└── logs/                      # combined.log + error.log (auto-created)
```

---

## Troubleshooting

**`audiocraft` not found**
```bash
pip install audiocraft
# If that fails, install from source:
pip install git+https://github.com/facebookresearch/audiocraft.git
```

**`ffmpeg: command not found`**  
Install ffmpeg for your OS — see Step 4 above.

**MusicGen is slow on CPU**  
Use `musicgen-small` and keep `MUSICGEN_DURATION` at 10s or less. For faster generation, run on a GPU machine and set `MUSICGEN_USE_GPU=true`.

**ElevenLabs 401 error**  
Check your `ELEVEN_API_KEY` in `.env`. Make sure there are no trailing spaces.

**Port already in use**  
Change `PORT=8000` in `.env` to any free port.

---

## Free Tier Limits

| Service | Free allowance |
|---------|---------------|
| Groq | 14,400 requests/day |
| ElevenLabs | ~10,000 characters/month |
| MusicGen | Unlimited (local) |
