/**
 * controllers/musicController.js
 * Handles GET /api/music?emotion=joy&intensity=5&language=Japanese&genre=Pop
 * Fetches Spotify recommendations based on emotion, intensity, language and genre.
 */

import { fetchRecommendations } from '../services/spotifyService.js';
import { VALID_EMOTIONS } from '../utils/emotionMapper.js';

export const getRecommendations = async (req, res) => {
  try {
    const { emotion, intensity } = req.query;
    const language = req.query.language || 'English';
    const genre    = req.query.genre    || '';
    const offset   = parseInt(req.query.offset, 10) || 0;

    // Validate emotion
    if (!emotion) {
      return res.status(400).json({ error: 'emotion query parameter is required.' });
    }

    const normalizedEmotion = emotion.toLowerCase().trim();
    const resolvedEmotion   = VALID_EMOTIONS.includes(normalizedEmotion)
      ? normalizedEmotion
      : 'neutral';

    // Parse intensity (1–10 scale, default 5)
    const intensityLevel = parseInt(intensity, 10) || 5;

    console.log(
      `[MusicController] emotion="${resolvedEmotion}" intensity=${intensityLevel} ` +
      `language="${language}" genre="${genre}" offset=${offset}`
    );

    const songs = await fetchRecommendations(resolvedEmotion, intensityLevel, language, genre, offset);

    return res.json({
      emotion:  resolvedEmotion,
      intensity: intensityLevel,
      language,
      genre,
      offset,
      songs,
    });

  } catch (error) {
    console.error('Music recommendation error:', error.message);
    return res.status(500).json({
      error:   'Failed to fetch music recommendations. Please try again.',
      details: error.message,
    });
  }
};
