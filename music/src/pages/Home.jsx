import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import InputSection from '../components/InputSection';
import EmotionDisplay from '../components/EmotionDisplay';
import SongList from '../components/SongList';
import { detectEmotion, getSongs } from '../services/api';

const Home = ({ onSaveEntry }) => {
  const location = useLocation();

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

  // Hydrate state from Journal if redirected
  useEffect(() => {
    if (location.state?.loadEntry) {
      const entry = location.state.loadEntry;
      setEmotionData(entry.emotionData);
      setSongs(entry.songs);
      if (entry.text) {
        setCurrentParams({ text: entry.text, intensity: 5, language: 'English', genre: '' });
      }
      
      // Clear the location state so refresh doesn't trigger it again
      window.history.replaceState({}, '');
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [location.state]);

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

  const handleSaveToJournal = () => {
    if (!emotionData || songs.length === 0 || !currentParams) return;
    const entry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      emotionData,
      songs,
      text: currentParams.text
    };
    onSaveEntry(entry);
  };

  const isLoading = loadingEmotion || loadingSongs;

  return (
    <div className="home-container">
      <header className="app-header">
        <h1 className="logo-text">
          Mood<span>Tune</span>
        </h1>
        <p className="tagline">
          Journal your thoughts — we'll find the perfect soundtrack.
        </p>
      </header>

      <InputSection onSubmit={handleAnalyze} loading={isLoading} />

      {error && (
        <div className="error-banner" role="alert">
          <span aria-hidden="true">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div ref={resultsRef}>
        {emotionData && !loadingEmotion && (
          <div className="generation-results-header">
            <EmotionDisplay
              emotion={emotionData.emotion}
              confidence={emotionData.confidence}
              allEmotions={emotionData.allEmotions}
              fallback={emotionData.fallback}
            />
            {songs.length > 0 && (
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <button className="submit-btn journal-save-btn" onClick={handleSaveToJournal}>
                  Save to Journal
                </button>
              </div>
            )}
          </div>
        )}

        <SongList 
          songs={songs} 
          loading={loadingSongs} 
          emotion={emotionData?.emotion} 
          onLoadMore={handleLoadMore}
        />
      </div>
    </div>
  );
};

export default Home;
