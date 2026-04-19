/**
 * components/InputSection.jsx
 * Text input + intensity slider + submit button.
 * Handles local form state (text, char count).
 */

import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

const MAX_CHARS = 500;

const InputSection = ({ onSubmit, loading }) => {
  const [text, setText] = useState(() => localStorage.getItem('moodTune_text') || '');
  const [intensity, setIntensity] = useState(() => {
    const saved = localStorage.getItem('moodTune_intensity');
    return saved !== null ? Number(saved) : 5;
  });
  const [language, setLanguage] = useState(() => localStorage.getItem('moodTune_language') || 'English');
  const [genre, setGenre] = useState(() => localStorage.getItem('moodTune_genre') || '');

  // Persist form inputs immediately
  useEffect(() => localStorage.setItem('moodTune_text', text), [text]);
  useEffect(() => localStorage.setItem('moodTune_intensity', intensity.toString()), [intensity]);
  useEffect(() => localStorage.setItem('moodTune_language', language), [language]);
  useEffect(() => localStorage.setItem('moodTune_genre', genre), [genre]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    onSubmit(text.trim(), intensity, language, genre);
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

        {/* Filters Row: Intensity, Language, Genre */}
        <div className="filters-grid">
          {/* Intensity slider */}
          <div className="slider-row filter-item">
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

          <div className="dropdowns-row">
            <div className="filter-item">
              <label htmlFor="language-select" className="slider-label">Language</label>
              <select 
                id="language-select" 
                className="custom-select" 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                disabled={loading}
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Spanish">Spanish</option>
                <option value="Korean">Korean</option>
                <option value="Japanese">Japanese</option>
                <option value="French">French</option>
              </select>
            </div>

            <div className="filter-item">
              <label htmlFor="genre-select" className="slider-label">Genre</label>
              <select 
                id="genre-select" 
                className="custom-select" 
                value={genre} 
                onChange={(e) => setGenre(e.target.value)}
                disabled={loading}
              >
                <option value="">Any Genre</option>
                <option value="Pop">Pop</option>
                <option value="Rock">Rock</option>
                <option value="Hip Hop">Hip Hop</option>
                <option value="Lo-Fi">Lo-Fi</option>
                <option value="Classical">Classical</option>
                <option value="Electronic">Electronic</option>
                <option value="R&B">R&B</option>
                <option value="Jazz">Jazz</option>
              </select>
            </div>
          </div>
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
