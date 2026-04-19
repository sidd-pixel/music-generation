/**
 * App.jsx — MoodTune Root Component
 */

import { useState, useRef, useEffect } from 'react';
import './index.css';

import InputSection from './components/InputSection';
import EmotionDisplay from './components/EmotionDisplay';
import SongList from './components/SongList';
import { detectEmotion, getSongs } from './services/api';

function App() {
  // Main feature state with localStorage persistence
  const [emotionData, setEmotionData] = useState(() => {
    const saved = localStorage.getItem('moodTune_emotionData');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [songs, setSongs] = useState(() => {
    const saved = localStorage.getItem('moodTune_songs');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [loadingEmotion, setLoadingEmotion] = useState(false);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [error, setError] = useState(null);

  const [offset, setOffset] = useState(() => {
    const saved = localStorage.getItem('moodTune_offset');
    return saved ? JSON.parse(saved) : 0;
  });
  
  const [currentParams, setCurrentParams] = useState(() => {
    const saved = localStorage.getItem('moodTune_currentParams');
    return saved ? JSON.parse(saved) : null;
  });

  const resultsRef = useRef(null);

  // Sync state changes to localStorage
  useEffect(() => {
    if (emotionData) localStorage.setItem('moodTune_emotionData', JSON.stringify(emotionData));
    else localStorage.removeItem('moodTune_emotionData');
  }, [emotionData]);

  useEffect(() => {
    localStorage.setItem('moodTune_songs', JSON.stringify(songs));
  }, [songs]);

  useEffect(() => {
    localStorage.setItem('moodTune_offset', JSON.stringify(offset));
  }, [offset]);

  useEffect(() => {
    if (currentParams) localStorage.setItem('moodTune_currentParams', JSON.stringify(currentParams));
    else localStorage.removeItem('moodTune_currentParams');
  }, [currentParams]);

  /**
   * Called when user submits the form.
   * Sequentially: detect emotion → fetch songs.
   */
  const handleAnalyze = async (text, intensity, language, genre) => {
    setError(null);
    setEmotionData(null);
    setSongs([]);
    setOffset(0);
    setCurrentParams({ text, intensity, language, genre });

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
      const musicData = await getSongs(detected.emotion, intensity, language, genre, 0);
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

  const handleLoadMore = async () => {
    if (!currentParams || !emotionData) return;
    setLoadingSongs(true);
    try {
      const nextOffset = offset + 15;
      const musicData = await getSongs(emotionData.emotion, currentParams.intensity, currentParams.language, currentParams.genre, nextOffset);
      
      // Filter out duplicate songs if the API returned them
      const newSongs = musicData.songs || [];
      setSongs(prev => {
        const existingIds = new Set(prev.map(s => s.id));
        const uniqueNew = newSongs.filter(s => !existingIds.has(s.id));
        return [...prev, ...uniqueNew];
      });
      
      setOffset(nextOffset);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to load more songs.';
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
          onLoadMore={handleLoadMore}
        />
      </div>
    </div>
  );
}

export default App;
