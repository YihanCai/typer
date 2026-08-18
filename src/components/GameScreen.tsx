import { useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSongById } from '../data/songs'
import { useGameEngine } from '../game/useGameEngine'
import type { LyricState } from '../types'

export default function GameScreen() {
  const { songId } = useParams<{ songId: string }>()
  const navigate = useNavigate()
  const song = songId ? getSongById(songId) : undefined
  const inputRef = useRef<HTMLInputElement>(null)
  const { gameState, feedback, startGame, inputChar, checkEarlyInput, getLyricPosition } = useGameEngine()
  const startedRef = useRef(false)

  // 自动开始游戏
  useEffect(() => {
    if (!song || startedRef.current) return
    startedRef.current = true
    startGame(song.lyrics)
  }, [song, startGame])

  // 聚焦输入框
  useEffect(() => {
    inputRef.current?.focus()
  })

  // 游戏结束跳转
  useEffect(() => {
    if (gameState?.phase === 'finished' && song) {
      const timer = setTimeout(() => {
        navigate('/result', {
          state: {
            songId: song.id,
            songTitle: song.title,
            songArtist: song.artist,
            score: gameState.score,
            maxCombo: gameState.maxCombo,
            totalLines: gameState.totalLines,
            completedLines: gameState.completedLines,
            missedLines: gameState.missedLines,
          },
        })
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [gameState?.phase, song, navigate])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      navigate('/')
      return
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      // 检查提前输入
      if (checkEarlyInput(e.key)) {
        e.preventDefault()
        return
      }
      inputChar(e.key)
    }
  }, [inputChar, checkEarlyInput, navigate])

  if (!song) {
    return (
      <div className="game-screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p>歌曲未找到</p>
        <button onClick={() => navigate('/')} style={{ marginTop: 16, padding: '8px 24px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          返回
        </button>
      </div>
    )
  }

  if (!gameState) {
    return (
      <div className="game-screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p>加载中...</p>
      </div>
    )
  }

  // 找到当前目标歌词（正在飘落中）
  const activeLyric = gameState.lyrics.find(l => l.status === 'falling' && l.typed > 0)
    ?? gameState.lyrics.find(l => l.status === 'falling')

  return (
    <div className="game-screen">
      {/* 顶部状态栏 */}
      <div className="game-header">
        <button className="back-btn" onClick={() => { startedRef.current = false; navigate('/') }}>
          ← 返回
        </button>
        <div className="song-info">
          {song.title} — {song.artist}
        </div>
        <div className="stats">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            时间: {gameState.currentTime.toFixed(1)}s
          </span>
          <span className="score">{gameState.score.toLocaleString()}</span>
          <span className={`combo ${gameState.combo > 0 ? 'active' : ''}`}>
            {gameState.combo > 0 ? `🔥 ${gameState.combo}` : '连击'}
          </span>
        </div>
      </div>

      {/* 进度条 */}
      <div className="progress-bar">
        {gameState.totalLines > 0 && (
          <div
            className="fill"
            style={{ width: `${(gameState.completedLines / gameState.totalLines) * 100}%` }}
          />
        )}
      </div>

      {/* 歌词飘落区 */}
      <div className="lyric-rain">
        {/* 判定线 */}
        <div className="judge-line" />

        {/* 反馈动画 */}
        {feedback.map(f => (
          <div key={f.id} className={`feedback ${f.result}`}>
            {f.result === 'perfect' ? 'PERFECT' : f.result === 'good' ? 'GOOD' : 'WRONG'}
          </div>
        ))}

        {/* 游戏结束遮罩 */}
        {gameState.phase === 'finished' && (
          <div className="game-over-overlay">
            <h2>🎵 游戏结束</h2>
            <p>正在结算...</p>
          </div>
        )}

        {/* 飘落歌词 */}
        {gameState.lyrics.map(lyric => (
          <LyricItem
            key={lyric.line.id}
            lyric={lyric}
            position={getLyricPosition(lyric)}
          />
        ))}
      </div>

      {/* 输入区域 */}
      <div className="input-area">
        <div className="input-wrapper">
          <div className="target-hint">
            {activeLyric ? (
              <>
                <span className="highlight">{activeLyric.line.text.slice(0, activeLyric.typed)}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>{activeLyric.line.text.slice(activeLyric.typed)}</span>
              </>
            ) : (
              '等待歌词飘落...'
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            autoFocus
            onKeyDown={handleKeyDown}
            placeholder={activeLyric ? '输入歌词...' : '⌛ 等待中...'}
            value=""
            onChange={() => {}}
            spellCheck={false}
            autoComplete="off"
          />
          <div className="input-status">
            <span>
              已完成 {gameState.completedLines}/{gameState.totalLines}
            </span>
            <span>{gameState.missedLines > 0 ? `漏掉 ${gameState.missedLines} 句` : ''}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 单个歌词飘落项 */
function LyricItem({ lyric, position }: { lyric: LyricState; position: number }) {
  // 未开始、已完成或超时的歌词不渲染
  if (lyric.status === 'pending' || lyric.status === 'completed' || lyric.status === 'missed') return null

  const top = `calc(${position * 80}%)`

  return (
    <div
      className={`lyric-falling status-${lyric.status}`}
      style={{ top }}
    >
      {lyric.line.text}
    </div>
  )
}