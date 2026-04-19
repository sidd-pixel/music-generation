/**
 * src/services/api.js
 * Axios instance configured for the MoodTune backend.
 * All API calls go through this module.
 */

import axios from 'axios';

// In development the Vite proxy handles /api → http://localhost:5000
// In production set VITE_API_BASE_URL env variable
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Detect emotion from text.
 * @param {string} text
 * @returns {{ emotion, confidence, allEmotions }}
 */
export const detectEmotion = async (text) => {
  const response = await api.post('/api/emotion', { text });
  return response.data;
};

/**
 * Get music recommendations for an emotion.
 * @param {string} emotion
 * @param {number} intensity - 1 to 10
 * @param {string} language
 * @param {string} genre
 * @returns {{ emotion, intensity, songs }}
 */
export const getSongs = async (emotion, intensity = 5, language = 'English', genre = '', offset = 0) => {
  const response = await api.get('/api/music', {
    params: { emotion, intensity, language, genre, offset },
  });
  return response.data;
};
