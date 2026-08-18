import { useNavigate } from 'react-router-dom'
import { songs } from '../data/songs'

export default function SongSelect() {
  const navigate = useNavigate()

  return (
    <div className="song-select">
      <h1>🎤 Typer</h1>
      <p className="subtitle">选择一首歌，打出飘落的歌词</p>

      <div className="song-list">
        {songs.map(song => (
          <div key={song.id} className="song-card">
            <div className="info">
              <h3>{song.title}</h3>
              <span>{song.artist} · {song.lyrics.length} 句歌词</span>
            </div>
            <button
              className="play-btn"
              onClick={() => navigate(`/play/${song.id}`)}
            >
              开始
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}