/**
 * components/InputSection.jsx
 * Text input + intensity slider + submit button.
 * Handles local form state (text, char count).
 */

import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

const MAX_CHARS = 500;

const InputSection = ({ onSubmit, loading }) => {
  const [text, setText] = useState('');
  const [intensity, setIntensity] = useState(5);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    onSubmit(text.trim(), intensity);
  };

  const charsLeft = MAX_CHARS - text.length;
  const isOverLimit = text.length > MAX_CHARS;

  return (
    <div className="input-card">
      <form onSubmit={handleSubmit}>
        {/* Textarea */}
        <label htmlFor="mood-input" className="input-label">
          How are you feeling?
        </label>
        <textarea
          id="mood-input"
          className="input-textarea"
          placeholder="Describe your mood… e.g. I feel really energetic and ready to take on the world"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={MAX_CHARS + 50}
          disabled={loading}
          aria-describedby="char-counter"
        />
        <div
          id="char-counter"
          className={`char-count ${isOverLimit ? 'warn' : ''}`}
        >
          {isOverLimit
            ? `${Math.abs(charsLeft)} characters over limit`
            : `${charsLeft} characters remaining`}
        </div>

        {/* Intensity slider */}
        <div className="slider-row">
          <span className="slider-label">
            Mood intensity
            <span className="intensity-val">{intensity}/10</span>
          </span>
          <input
            id="intensity-slider"
            type="range"
            className="mood-slider"
            min={1}
            max={10}
            step={1}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            disabled={loading}
            aria-label="Mood intensity from 1 to 10"
          />
        </div>

        {/* Submit */}
        <button
          id="analyze-btn"
          type="submit"
          className="submit-btn"
          disabled={loading || !text.trim() || isOverLimit}
        >
          {loading ? (
            <>
              <LoadingSpinner size={17} />
              Analyzing mood…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              Analyze Mood &amp; Get Music
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default InputSection;
