/**
 * components/EmotionDisplay.jsx
 * Shows the detected emotion with emoji, confidence bar, and description.
 */

import { getEmotionConfig } from '../utils/emotionConfig';

const EmotionDisplay = ({ emotion, confidence, allEmotions, fallback }) => {
  const config = getEmotionConfig(emotion);
  const pct = Math.round((confidence || 0) * 100);

  return (
    <div className="emotion-card" role="status" aria-live="polite">
      {/* Emoji */}
      <div className="emotion-icon" aria-hidden="true">
        {config.emoji}
      </div>

      {/* Label + description */}
      <div className="emotion-info">
        <div className="label">Detected Mood</div>
        <div
          className="value"
          style={{ color: config.color }}
        >
          {config.label}
        </div>
        <div className="confidence">
          {fallback
            ? 'Could not detect — showing default'
            : config.description}
        </div>
      </div>

      {/* Confidence bar (hidden on very small screens via CSS) */}
      {!fallback && confidence > 0 && (
        <div className="confidence-bar-wrap" aria-label={`Confidence: ${pct}%`}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            {pct}% confident
          </span>
          <div className="confidence-bar-bg">
            <div
              className="confidence-bar-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionDisplay;
