import YouTube from 'react-youtube';

const JournalCard = ({ entry, isPlaying, onPlayToggle, onDelete, onViewFull }) => {
  const { date, emotionData, songs, text } = entry;
  const parsedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="journal-card">
      <div className="journal-card-header">
        <span className="journal-date">{parsedDate}</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="journal-mood-badge" data-emotion={emotionData.emotion}>
            {(emotionData.emotion === 'joy' || emotionData.emotion === 'amusement') ? '😊' :
             (emotionData.emotion === 'sadness' || emotionData.emotion === 'grief') ? '😢' :
             (emotionData.emotion === 'anger' || emotionData.emotion === 'annoyance') ? '😠' :
             (emotionData.emotion === 'fear' || emotionData.emotion === 'nervousness') ? '😨' :
             (emotionData.emotion === 'surprise') ? '😲' :
             (emotionData.emotion === 'love' || emotionData.emotion === 'caring') ? '❤️' : '😶'} 
             <span style={{marginLeft: '0.5rem', textTransform: 'capitalize'}}>{emotionData.emotion}</span>
          </div>
          <button 
            onClick={() => onDelete(entry.id)} 
            style={{background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem'}}
            title="Delete Journal Entry"
          >
            🗑️
          </button>
        </div>
      </div>
      
      <div className="journal-card-body" style={{ cursor: 'pointer' }} onClick={onViewFull}>
        <p className="journal-text">"{text}"</p>
      </div>

      <div className="journal-card-footer">
        <div className="journal-songs-preview">
          <span>🎵 {songs.length} Tracks</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn-play-journal" 
            onClick={onViewFull}
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            View Full List 🎵
          </button>
          <button 
            className="btn-play-journal" 
            onClick={() => onPlayToggle(entry.id)}
          >
            {isPlaying ? 'Stop Soundtrack ⏹️' : 'Replay Soundtrack ▶️'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JournalCard;
