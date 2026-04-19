/**
 * controllers/emotionController.js
 * Handles POST /api/emotion
 * Validates input, calls HuggingFace service, returns emotion data.
 */

import { analyzeEmotion } from '../services/huggingFaceService.js';

export const detectEmotion = async (req, res) => {
  try {
    const { text } = req.body;

    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide a non-empty text field.' });
    }

    if (text.trim().length > 500) {
      return res.status(400).json({ error: 'Text must be 500 characters or fewer.' });
    }

    // Call HuggingFace emotion model
    const result = await analyzeEmotion(text.trim());

    return res.json({
      emotion: result.emotion,
      confidence: result.confidence,
      allEmotions: result.allEmotions,
    });

  } catch (error) {
    console.error('Emotion detection error:', error.message);
    return res.status(500).json({
      error: 'Failed to detect emotion. Please try again.',
      details: error.message,
    });
  }
};
