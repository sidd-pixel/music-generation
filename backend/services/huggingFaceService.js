/**
 * services/huggingFaceService.js
 * Calls the Hugging Face Inference API to detect emotion from text.
 * Model: j-hartmann/emotion-english-distilroberta-base
 *   Labels: anger, disgust, fear, joy, neutral, sadness, surprise
 *
 * NOTE: HuggingFace changed their Inference API endpoint in 2024/2025.
 *   Old (broken): https://api-inference.huggingface.co/models/...
 *   New (working): https://router.huggingface.co/hf-inference/models/...
 */

import axios from 'axios';

const HF_API_URL =
  'https://router.huggingface.co/hf-inference/models/j-hartmann/emotion-english-distilroberta-base';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 4000; // Model may be cold-starting

/**
 * Sleep helper for retry delay.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Analyze text and return the top detected emotion.
 * Falls back to "neutral" if all retries fail.
 *
 * @param {string} text
 * @returns {{ emotion: string, confidence: number, allEmotions: Array }}
 */
export const analyzeEmotion = async (text) => {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`HuggingFace: attempt ${attempt} for text: "${text.substring(0, 50)}..."`);

      const response = await axios.post(
        HF_API_URL,
        { inputs: text },
        {
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        }
      );

      // HF returns [[{ label, score }, ...]] — first array is for first input
      const predictions = response.data[0];

      if (!predictions || !Array.isArray(predictions)) {
        throw new Error('Unexpected response format from HuggingFace API');
      }

      // Sort by score descending to get the top emotion
      const sorted = [...predictions].sort((a, b) => b.score - a.score);
      const top = sorted[0];

      console.log(`HuggingFace: detected "${top.label}" with confidence ${top.score.toFixed(3)}`);

      return {
        emotion: top.label.toLowerCase(),
        confidence: parseFloat(top.score.toFixed(3)),
        allEmotions: sorted.map((e) => ({
          label: e.label.toLowerCase(),
          score: parseFloat(e.score.toFixed(3)),
        })),
      };

    } catch (error) {
      lastError = error;

      // If model is loading (503), wait and retry
      if (error.response?.status === 503 && attempt < MAX_RETRIES) {
        console.log(`HuggingFace model loading, retrying in ${RETRY_DELAY_MS}ms...`);
        await sleep(RETRY_DELAY_MS);
        continue;
      }

      // Log and break for other errors
      console.error(`HuggingFace attempt ${attempt} failed:`, error.response?.status, error.message);
      break;
    }
  }

  // All retries failed — return neutral fallback
  console.error('HuggingFace service failed after retries:', lastError?.message);
  return {
    emotion: 'neutral',
    confidence: 0,
    allEmotions: [],
    fallback: true,
  };
};
