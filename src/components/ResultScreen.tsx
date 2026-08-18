import { useLocation, useNavigate } from 'react-router-dom'

interface ResultState {
  songId: string
  songTitle: string
  songArtist: string
  score: number
  maxCombo: number
  totalLines: number
  completedLines: number
  missedLines: number
}

export default function ResultScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as ResultState | null

  if (!state) {
    return (
      <div className="result-screen">
        <h1>没有游戏数据</h1>
        <div className="actions">
          <button className="btn-home" onClick={() => navigate('/')}>返回首页</button>
        </div>
      </div>
    )
  }

  const accuracy = state.totalLines > 0
    ? Math.round((state.completedLines / state.totalLines) * 100)
    : 0

  return (
    <div className="result-screen">
      <h1>🎵 游戏结束</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
        {state.songTitle} — {state.songArtist}
      </p>

      <div className="final-score">{state.score.toLocaleString()}</div>

      <div className="stats-grid">
        <div className="stat-item">
          <div className="label">完成率</div>
          <div className="value" style={{ color: 'var(--success)' }}>{accuracy}%</div>
        </div>
        <div className="stat-item">
          <div className="label">完成 / 总句</div>
          <div className="value" style={{ color: 'var(--accent)' }}>
            {state.completedLines} / {state.totalLines}
          </div>
        </div>
        <div className="stat-item">
          <div className="label">最高连击</div>
          <div className="value" style={{ color: 'var(--warning)' }}>🔥 {state.maxCombo}</div>
        </div>
      </div>

      <div className="actions">
        <button
          className="btn-replay"
          onClick={() => navigate(`/play/${state.songId}?t=${Date.now()}`)}
        >
          再来一次
        </button>
        <button className="btn-home" onClick={() => navigate('/')}>
          返回选歌
        </button>
      </div>
    </div>
  )
}