import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import YouTube from 'react-youtube';
import JournalCard from '../components/JournalCard';

const Journal = ({ entries, onDeleteEntry }) => {
  const navigate = useNavigate();
  const [activePlaybackId, setActivePlaybackId] = useState(null);
  const [activeYoutubeId, setActiveYoutubeId] = useState(null);
  const [songQueue, setSongQueue] = useState([]);

  // Calculate mood stats
  const moodCounts = entries.reduce((acc, entry) => {
    const mood = entry.emotionData.emotion;
    acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {});

  const handlePlayToggle = (entryId) => {
    if (activePlaybackId === entryId) {
      // Stop playing
      setActivePlaybackId(null);
      setActiveYoutubeId(null);
      setSongQueue([]);
      return;
    }

    const entry = entries.find(e => e.id === entryId);
    if (!entry || entry.songs.length === 0) return;

    // Filter valid youtube IDs
    const validSongs = entry.songs.filter(s => s.youtubeId);
    if (validSongs.length === 0) return;

    setActivePlaybackId(entryId);
    setActiveYoutubeId(validSongs[0].youtubeId);
    setSongQueue(validSongs.slice(1));
  };

  const handleSongEnd = () => {
    if (songQueue.length > 0) {
      const nextSong = songQueue[0];
      setActiveYoutubeId(nextSong.youtubeId);
      setSongQueue(songQueue.slice(1));
    } else {
      setActivePlaybackId(null);
      setActiveYoutubeId(null);
    }
  };

  const resetPlay = () => {
    setActivePlaybackId(null);
    setActiveYoutubeId(null);
    setSongQueue([]);
  };

  return (
    <div className="journal-container">
      <header className="app-header">
        <h1 className="logo-text">Mindfulness <span>Journal</span></h1>
        <p className="tagline">Reflect on your emotional journey.</p>
      </header>

      {/* Headless Audio Engine (Invisible) */}
      {activeYoutubeId && (
        <div style={{ position: 'absolute', top: '-999px', left: '-999px', opacity: 0 }} aria-hidden="true">
          <YouTube 
            videoId={activeYoutubeId}
            opts={{ height: '0', width: '0', playerVars: { autoplay: 1 } }}
            onEnd={handleSongEnd}
            onError={handleSongEnd} // Skip on error
          />
        </div>
      )}

      {/* Dashboard Stats */}
      {entries.length > 0 && (
        <div className="journal-dashboard">
          <div className="dashboard-stats">
            <div className="stat-box">
              <h3>Total Entries</h3>
              <p>{entries.length}</p>
            </div>
            <div className="stat-box mood-distribution">
              <h3>Mood Distribution</h3>
              <div className="mood-dots">
                {Object.entries(moodCounts).map(([mood, count]) => (
                  <div key={mood} className="mood-dot-container" title={`${mood}: ${count}`}>
                    <span className="mood-dot" data-emotion={mood}></span>
                    <span className="mood-count" style={{textTransform: 'capitalize'}}>{mood} {count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entries List */}
      <div className="journal-feed">
        {entries.length === 0 ? (
          <div className="empty-journal">
            <p>Your journal is empty. Generate a soundtrack from the Home tab and save it to begin your mindfulness journey.</p>
          </div>
        ) : (
          [...entries].reverse().map(entry => (
            <JournalCard 
              key={entry.id} 
              entry={entry} 
              isPlaying={activePlaybackId === entry.id}
              onPlayToggle={handlePlayToggle}
              onDelete={onDeleteEntry}
              onViewFull={() => navigate('/', { state: { loadEntry: entry }})}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Journal;
