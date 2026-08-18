import { useState, useCallback, useEffect, useRef } from 'react'
import type { LyricLine, LyricState, LyricStatus, GameState, JudgeResult } from '../types'

const FALL_DURATION = 2.5
const DEFAULT_DURATION = 2.5
const PERFECT_RATIO = 0.3
const TICK_INTERVAL = 50 // ms

export interface FeedbackItem {
  id: number
  result: JudgeResult
}

function createInitialState(lyrics: LyricLine[]): GameState {
  const sorted = [...lyrics].sort((a, b) => a.time - b.time)
  return {
    phase: 'playing',
    song: null,
    currentTime: 0,
    lyrics: sorted.map((line) => ({
      line: { ...line, duration: line.duration || DEFAULT_DURATION },
      status: 'pending' as LyricStatus,
      typed: 0,
      score: 0,
    })),
    score: 0,
    combo: 0,
    maxCombo: 0,
    totalLines: sorted.length,
    completedLines: 0,
    missedLines: 0,
  }
}

function calcPosition(lyric: LyricState, now: number): number {
  const { time, duration } = lyric.line
  const fallStart = time - FALL_DURATION
  if (lyric.status === 'pending') return -0.5
  if (lyric.status === 'completed' || lyric.status === 'missed') return 1.1
  if (now <= time) {
    return (now - fallStart) / FALL_DURATION
  } else {
    const activeProgress = (now - time) / duration
    return Math.min(1, activeProgress * 0.1 + 1)
  }
}

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])

  // 用 ref 存可变数据
  const lyricsRef = useRef<LyricState[]>([])
  const startTimeRef = useRef(0)
  const scoreRef = useRef(0)
  const comboRef = useRef(0)
  const maxComboRef = useRef(0)
  const completedRef = useRef(0)
  const missedRef = useRef(0)
  const feedbackIdRef = useRef(0)
  const phaseRef = useRef<'idle' | 'playing' | 'paused' | 'finished'>('idle')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 构建新 state 触发重渲染
  const buildState = useCallback((elapsed: number): GameState => ({
    phase: phaseRef.current as 'playing' | 'finished',
    song: null,
    currentTime: elapsed,
    lyrics: lyricsRef.current.map(l => ({ ...l, line: { ...l.line } })),
    score: scoreRef.current,
    combo: comboRef.current,
    maxCombo: maxComboRef.current,
    totalLines: lyricsRef.current.length,
    completedLines: completedRef.current,
    missedLines: missedRef.current,
  }), [])

  // 游戏 tick
  const tick = useCallback(() => {
    if (phaseRef.current !== 'playing') return

    const elapsed = (performance.now() - startTimeRef.current) / 1000

    // 更新歌词状态
    for (const lyric of lyricsRef.current) {
      if (lyric.status === 'completed' || lyric.status === 'missed') continue
      const { time, duration } = lyric.line
      const fallStart = time - FALL_DURATION
      const activeEnd = time + duration

      if (elapsed < fallStart) lyric.status = 'pending'
      else if (elapsed < time) lyric.status = 'falling'
      else if (elapsed < activeEnd) lyric.status = 'active'
    }

    // 检查超时
    for (const lyric of lyricsRef.current) {
      if (lyric.status !== 'active') continue
      if (elapsed > lyric.line.time + lyric.line.duration) {
        lyric.status = 'missed'
        lyric.score = -50
        comboRef.current = 0
        missedRef.current++
      }
    }

    setGameState(buildState(elapsed))
  }, [buildState])

  // 开始游戏
  const startGame = useCallback((lyrics: LyricLine[]) => {
    // 清理旧循环
    if (intervalRef.current) clearInterval(intervalRef.current)

    const initial = createInitialState(lyrics)
    lyricsRef.current = initial.lyrics
    startTimeRef.current = performance.now()
    scoreRef.current = 0
    comboRef.current = 0
    maxComboRef.current = 0
    completedRef.current = 0
    missedRef.current = 0
    phaseRef.current = 'playing'

    // 初始渲染
    setGameState(buildState(0))

    // 直接启动游戏循环
    intervalRef.current = setInterval(tick, TICK_INTERVAL)
  }, [buildState, tick])

  // 输入字符
  const inputChar = useCallback((char: string) => {
    if (phaseRef.current !== 'playing') return

    const active = lyricsRef.current.find(l => l.status === 'active')
    if (!active) return

    const expected = active.line.text
    const nextChar = expected[active.typed]

    if (char === nextChar) {
      active.typed++
      if (active.typed >= expected.length) {
        active.status = 'completed'
        completedRef.current++
        comboRef.current++
        if (comboRef.current > maxComboRef.current) {
          maxComboRef.current = comboRef.current
        }

        const elapsed = (performance.now() - startTimeRef.current) / 1000
        const timeSinceActive = elapsed - active.line.time
        const windowRatio = timeSinceActive / active.line.duration
        const timingBonus = Math.abs(windowRatio - 0.5) < PERFECT_RATIO / 2 ? 1.5 : 1.0
        const score = Math.round(100 * timingBonus)
        active.score = score
        scoreRef.current += score

        const result: JudgeResult = timingBonus > 1.0 ? 'perfect' : 'good'
        const id = ++feedbackIdRef.current
        setFeedback(prev => [...prev, { id, result }])
        setTimeout(() => setFeedback(prev => prev.filter(f => f.id !== id)), 600)

        // 检查是否全部完成
        const allDone = lyricsRef.current.every(l => l.status === 'completed' || l.status === 'missed')
        if (allDone) {
          phaseRef.current = 'finished'
          if (intervalRef.current) clearInterval(intervalRef.current)
        }

        setGameState(buildState(elapsed))
      }
    } else {
      scoreRef.current = Math.max(0, scoreRef.current - 30)
      comboRef.current = 0
      const id = ++feedbackIdRef.current
      setFeedback(prev => [...prev, { id, result: 'wrong' as JudgeResult }])
      setTimeout(() => setFeedback(prev => prev.filter(f => f.id !== id)), 600)
    }
  }, [buildState])

  // 提前输入检查
  const checkEarlyInput = useCallback((char: string): boolean => {
    if (phaseRef.current !== 'playing') return false
    const hasActive = lyricsRef.current.some(l => l.status === 'active')
    if (hasActive) return false
    const falling = lyricsRef.current.find(l => l.status === 'falling')
    if (falling && falling.line.text[0] === char) {
      scoreRef.current = Math.max(0, scoreRef.current - 30)
      comboRef.current = 0
      const id = ++feedbackIdRef.current
      setFeedback(prev => [...prev, { id, result: 'wrong' as JudgeResult }])
      setTimeout(() => setFeedback(prev => prev.filter(f => f.id !== id)), 600)
      return true
    }
    return false
  }, [])

  // 获取歌词位置
  const getLyricPosition = useCallback((lyric: LyricState): number => {
    return calcPosition(lyric, (performance.now() - startTimeRef.current) / 1000)
  }, [])

  // 停止
  const stopGame = useCallback(() => {
    phaseRef.current = 'finished'
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  // 清理
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return {
    gameState,
    feedback,
    startGame,
    stopGame,
    inputChar,
    checkEarlyInput,
    getLyricPosition,
  }
}