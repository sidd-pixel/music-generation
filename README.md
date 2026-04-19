# 🎵 MoodTune — Emotion-Based Music Recommendation System

MoodTune detects your mood from text and curates a Spotify playlist that matches exactly how you feel.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite + Tailwind CSS v4 |
| Backend | Node.js + Express |
| Emotion AI | Hugging Face `distilroberta-base` |
| Music | Spotify Web API |

---

## Project Structure

```
music generation/
├── backend/                  # Node.js + Express API
│   ├── controllers/
│   │   ├── emotionController.js
│   │   └── musicController.js
│   ├── routes/
│   │   ├── emotionRoutes.js
│   │   └── musicRoutes.js
│   ├── services/
│   │   ├── huggingFaceService.js
│   │   └── spotifyService.js
│   ├── utils/
│   │   └── emotionMapper.js
│   ├── .env                  # ← your API keys go here
│   ├── .env.example
│   └── server.js
│
└── music/                    # React frontend
    ├── src/
    │   ├── components/
    │   │   ├── InputSection.jsx
    │   │   ├── EmotionDisplay.jsx
    │   │   ├── SongCard.jsx
    │   │   ├── SongList.jsx
    │   │   └── LoadingSpinner.jsx
    │   ├── services/api.js
    │   ├── utils/emotionConfig.js
    │   └── App.jsx
    └── vite.config.js
```

---

## Setup & Running

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Backend

```bash
cd backend
cp .env.example .env         # then fill in your keys
npm install
npm run dev                  # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd music
npm install
npm run dev                  # starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Environment Variables (backend/.env)

| Variable | Where to get it |
|----------|----------------|
| `HUGGINGFACE_API_KEY` | https://huggingface.co/settings/tokens |
| `SPOTIFY_CLIENT_ID` | https://developer.spotify.com/dashboard |
| `SPOTIFY_CLIENT_SECRET` | https://developer.spotify.com/dashboard |
| `PORT` | Default: `5000` |

---

## API Endpoints

### `POST /api/emotion`

Detect emotion from text.

**Request body:**
```json
{ "text": "I feel really happy today!" }
```

**Response:**
```json
{
  "emotion": "joy",
  "confidence": 0.972,
  "allEmotions": [
    { "label": "joy", "score": 0.972 },
    ...
  ]
}
```

---

### `GET /api/music?emotion=joy&intensity=7`

Fetch Spotify song recommendations.

**Query params:**
- `emotion` — one of: joy, sadness, anger, fear, disgust, surprise, neutral, calm
- `intensity` — 1–10 (scales energy of recommendations)

**Response:**
```json
{
  "emotion": "joy",
  "intensity": 7,
  "songs": [
    {
      "id": "...",
      "name": "Song Title",
      "artist": "Artist Name",
      "album": "Album Name",
      "albumImage": "https://...",
      "previewUrl": "https://...",
      "spotifyUrl": "https://...",
      "durationMs": 210000
    }
  ]
}
```

---

## Emotion → Music Mapping

| Emotion | Valence | Energy | Danceability | Genres |
|---------|---------|--------|-------------|--------|
| Joy | 0.85 | 0.80 | 0.75 | pop, happy, dance |
| Sadness | 0.20 | 0.25 | 0.30 | sad, acoustic, indie |
| Anger | 0.20 | 0.90 | 0.50 | metal, rock, punk |
| Fear | 0.25 | 0.60 | 0.35 | ambient, dark |
| Disgust | 0.20 | 0.55 | 0.40 | alternative, grunge |
| Surprise | 0.72 | 0.78 | 0.68 | electro, pop |
| Neutral | 0.50 | 0.50 | 0.50 | pop, indie, chill |
| Calm | 0.55 | 0.28 | 0.38 | chill, ambient |

---

## Features

- ✅ Emotion detection via HuggingFace AI
- ✅ Spotify music recommendations with audio feature tuning
- ✅ Mood intensity slider (scales energy parameter)
- ✅ Song preview playback (one at a time)
- ✅ Skeleton loading states
- ✅ Graceful error handling with fallback
- ✅ Responsive dark-mode UI
- ✅ Confidence score display

---

## Notes

- Spotify `preview_url` can be `null` for some tracks — those cards show "No preview" instead of a play button.
- The HuggingFace model may take ~10s to warm up on first request (cold start). The backend automatically retries.
- Spotify token is cached server-side and refreshes automatically when expired.
