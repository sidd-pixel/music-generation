/**
 * components/SongCard.jsx
 * Displays a single track with album art, name, artist, and play button.
 * Receives `isPlaying` and `onPlay` from parent to enforce single-track playback.
 */

const SongCard = ({ song, isPlaying, onPlay }) => {
  const {
    id,
    name,
    artist,
    album,
    albumImage,
    spotifyUrl,
    durationMs,
    youtubeId,
  } = song;

  // Format duration mm:ss (if available)
  const formatDuration = (ms) => {
    if (!ms) return '';
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <article
      className={`song-card ${isPlaying ? 'playing' : ''}`}
      aria-label={`${name} by ${artist}`}
    >
      {/* Album artwork */}
      {albumImage ? (
        <img
          src={albumImage}
          alt={`${album} album cover`}
          className="song-album-img"
          loading="lazy"
        />
      ) : (
        <div className="song-album-placeholder" aria-hidden="true">
          🎵
        </div>
      )}

      {/* Song info */}
      <div className="song-info">
        <div className="song-name" title={name}>{name}</div>
        <div className="song-artist" title={artist}>{artist}</div>

        <div className="song-actions">
          {/* Headless Audio Play Button */}
          {youtubeId ? (
            <button
              id={`play-btn-${id}`}
              className={`play-btn ${isPlaying ? 'active' : ''}`}
              onClick={() => onPlay(id, youtubeId)}
              aria-label={isPlaying ? `Pause ${name}` : `Play ${name}`}
              aria-pressed={isPlaying}
            >
              {isPlaying ? (
                <>
                  <PauseIcon /> Pause
                </>
              ) : (
                <>
                  <PlayIcon /> Play
                </>
              )}
            </button>
          ) : (
            <span className="no-preview">Audio unavailable</span>
          )}

          {/* Open full song in Spotify directly */}
          {spotifyUrl && (
            <a
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="spotify-link"
              aria-label={`Open ${name} in Spotify`}
            >
              <SpotifyIcon /> {formatDuration(durationMs)} ↗
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

/* ── Inline SVG Icons ── */
const PlayIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const PauseIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const SpotifyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ marginBottom: '-2px' }}>
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.54.659.301 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.241 1.2zM20.16 9.6C16.44 7.379 9.54 7.14 5.58 8.34c-.599.18-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.56-1.32 12.12-1.08 16.2 1.32.54.3 0.72 1.02.42 1.5-.3.6-.96.72-1.38.54z" />
  </svg>
);

export default SongCard;
