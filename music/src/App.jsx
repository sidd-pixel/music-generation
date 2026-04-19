/**
 * App.jsx — MoodTune Root Component
 */

import { useState, useRef } from 'react';
import './index.css';

import InputSection from './components/InputSection';
import EmotionDisplay from './components/EmotionDisplay';
import SongList from './components/SongList';
import { detectEmotion, getSongs } from './services/api';

function App() {
  // Main feature state
  const [emotionData, setEmotionData] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loadingEmotion, setLoadingEmotion] = useState(false);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [error, setError] = useState(null);

  const resultsRef = useRef(null);

  /**
   * Called when user submits the form.
   * Sequentially: detect emotion → fetch songs.
   */
  const handleAnalyze = async (text, intensity, language, genre) => {
    setError(null);
    setEmotionData(null);
    setSongs([]);

    // ── Step 1: Detect emotion ──
    setLoadingEmotion(true);
    let detected;
    try {
      detected = await detectEmotion(text);
      setEmotionData(detected);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to analyze emotion.';
      setError(msg);
      setLoadingEmotion(false);
      return;
    } finally {
      setLoadingEmotion(false);
    }

    // ── Step 2: Fetch songs ──
    setLoadingSongs(true);
    try {
      const musicData = await getSongs(detected.emotion, intensity, language, genre);
      setSongs(musicData.songs || []);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);

    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to fetch music recommendations.';
      setError(msg);
    } finally {
      setLoadingSongs(false);
    }
  };

  const isLoading = loadingEmotion || loadingSongs;

  return (
    <div className="app-container">
      {/* ── Header ── */}
      <header className="app-header">
        <h1 className="logo-text">
          Mood<span>Tune</span>
        </h1>
        <p className="tagline">
          Tell us how you feel — we'll find the perfect soundtrack.
        </p>
      </header>

      {/* ── Input Form ── */}
      <InputSection onSubmit={handleAnalyze} loading={isLoading} />

      {/* ── Error Banner ── */}
      {error && (
        <div className="error-banner" role="alert">
          <span aria-hidden="true">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Results ── */}
      <div ref={resultsRef}>
        {/* Emotion display */}
        {emotionData && !loadingEmotion && (
          <EmotionDisplay
            emotion={emotionData.emotion}
            confidence={emotionData.confidence}
            allEmotions={emotionData.allEmotions}
            fallback={emotionData.fallback}
          />
        )}

        {/* Song list / skeletons */}
        <SongList 
          songs={songs} 
          loading={loadingSongs} 
          emotion={emotionData?.emotion} 
        />
      </div>
    </div>
  );
}

export default App;
