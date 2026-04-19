/**
 * src/utils/emotionConfig.js
 * Emoji and display metadata for each emotion label.
 * Used by the EmotionDisplay component.
 */

export const EMOTION_CONFIG = {
  joy: {
    emoji: '😄',
    label: 'Joy',
    description: 'You\'re feeling great!',
    color: '#fbbf24',
  },
  sadness: {
    emoji: '😢',
    label: 'Sadness',
    description: 'A melancholic mood.',
    color: '#60a5fa',
  },
  anger: {
    emoji: '😤',
    label: 'Anger',
    description: 'Feeling frustrated.',
    color: '#f87171',
  },
  fear: {
    emoji: '😨',
    label: 'Fear',
    description: 'A tense state of mind.',
    color: '#a78bfa',
  },
  disgust: {
    emoji: '😒',
    label: 'Disgust',
    description: 'Something feels off.',
    color: '#6ee7b7',
  },
  surprise: {
    emoji: '😮',
    label: 'Surprise',
    description: 'Something unexpected!',
    color: '#fb923c',
  },
  neutral: {
    emoji: '😐',
    label: 'Neutral',
    description: 'A balanced state.',
    color: '#9ca3af',
  },
  calm: {
    emoji: '😌',
    label: 'Calm',
    description: 'Feeling at ease.',
    color: '#34d399',
  },
};

/**
 * Get config for an emotion, with fallback.
 * @param {string} emotion
 */
export const getEmotionConfig = (emotion) => {
  return EMOTION_CONFIG[emotion?.toLowerCase()] || EMOTION_CONFIG.neutral;
};
