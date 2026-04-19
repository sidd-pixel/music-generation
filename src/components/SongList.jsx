/**
 * components/SongList.jsx
 * Renders the grid of SongCards.
 * Hosts a headless YouTube engine to power full-song playback securely.
 */

import { useState } from 'react';
import YouTube from 'react-youtube';
import SongCard from './SongCard';

const SkeletonCard = () => (
  <div className="skeleton-card" aria-hidden="true">
    <div className="skeleton-img" />
    <div className="skeleton-body">
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
      <div className="skeleton-line btn" />
    </div>
  </div>
);

const SongList = ({ songs, loading }) => {
  const [playingId, setPlayingId] = useState(null);
  const [activeYoutubeId, setActiveYoutubeId] = useState(null);

  const handlePlay = (id, youtubeId) => {
    if (playingId === id) {
      setPlayingId(null);
      setActiveYoutubeId(null);
      return;
    }
    setPlayingId(id);
    setActiveYoutubeId(youtubeId);
  };

  const resetPlay = () => {
    setPlayingId(null);
    setActiveYoutubeId(null);
  };

  if (loading) {
    return (
      <>
        <div className="songs-section-title" aria-live="polite">Finding your soundtrack…</div>
        <div className="songs-grid" aria-label="Loading songs">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </>
    );
  }

  if (!songs || songs.length === 0) return null;

  return (
    <section aria-label="Recommended songs">

      {/* Headless Audio Engine (Invisible) */}
      {activeYoutubeId && (
        <div style={{ position: 'absolute', top: '-999px', left: '-999px', opacity: 0 }} aria-hidden="true">
          <YouTube 
            videoId={activeYoutubeId}
            opts={{ height: '0', width: '0', playerVars: { autoplay: 1 } }}
            onEnd={resetPlay}
            onError={resetPlay}
          />
        </div>
      )}

      <div className="songs-section-title">
        {songs.length} Tracks Curated for Your Mood
      </div>
      <div className="songs-grid">
        {songs.map((song, idx) => (
          <div
            key={song.id || idx}
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <SongCard 
              song={song} 
              isPlaying={playingId === song.id}
              onPlay={handlePlay}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default SongList;
