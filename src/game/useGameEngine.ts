import { useState, useCallback, useEffect, useRef } from 'react'
import type { LyricLine, LyricState, LyricStatus, GameState, JudgeResult } from '../types'
import { getFallDuration, EXIT_SECONDS, PERFECT_RATIO } from './timing'
import { sfx } from './sfx'

/** 游戏循环间隔（ms） */
const TICK_INTERVAL = 50

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
      line: { ...line },
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

/** 计算歌词位置（0=顶部, 1=判定线, >1 滑出屏幕） */
function calcPosition(lyric: LyricState, now: number): number {
  const { time } = lyric.line
  const fallDur = getFallDuration(lyric.line.text)
  const fallStart = time - fallDur
  if (lyric.status === 'pending') return -0.5
  if (lyric.status === 'completed' || lyric.status === 'missed') return -0.5
  return Math.max(0, Math.min((now - fallStart) / fallDur, 1.3))
}

/** 是否全部歌词都已终结（completed 或 missed） */
function allDoneLyrics(lyrics: LyricState[]): boolean {
  return lyrics.length > 0 && lyrics.every(l => l.status === 'completed' || l.status === 'missed')
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

  // 弹出判定反馈
  const emitFeedback = useCallback((result: JudgeResult) => {
    const id = ++feedbackIdRef.current
    setFeedback(prev => [...prev, { id, result }])
    setTimeout(() => setFeedback(prev => prev.filter(f => f.id !== id)), 600)
  }, [])

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

    // 状态流转：pending → falling（进入屏幕即飘落、即可输入）
    for (const lyric of lyricsRef.current) {
      if (lyric.status === 'completed' || lyric.status === 'missed') continue
      const { time } = lyric.line
      const fallStart = time - getFallDuration(lyric.line.text)
      lyric.status = elapsed < fallStart ? 'pending' : 'falling'
    }

    // 超时检查：滑出屏幕（含宽限期）未完成 → miss
    let missedNow = false
    for (const lyric of lyricsRef.current) {
      if (lyric.status !== 'falling') continue
      if (elapsed > lyric.line.time + EXIT_SECONDS) {
        lyric.status = 'missed'
        lyric.score = -50
        comboRef.current = 0
        missedRef.current++
        missedNow = true
      }
    }
    if (missedNow) sfx.miss()

    // 全部完成/漏掉 → 游戏结束
    if (allDoneLyrics(lyricsRef.current)) {
      phaseRef.current = 'finished'
      if (intervalRef.current) clearInterval(intervalRef.current)
      sfx.gameOver()
    }

    setGameState(buildState(elapsed))
  }, [buildState])

  // 开始游戏
  const startGame = useCallback((lyrics: LyricLine[]) => {
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

    setGameState(buildState(0))
    intervalRef.current = setInterval(tick, TICK_INTERVAL)
  }, [buildState, tick])

  // 输入字符（飘落全程可输入）
  const inputChar = useCallback((char: string) => {
    if (phaseRef.current !== 'playing') return

    // 当前目标：正在输入中的歌词优先，否则取第一个飘落中的
    const target = lyricsRef.current.find(l => l.status === 'falling' && l.typed > 0)
      ?? lyricsRef.current.find(l => l.status === 'falling')
    if (!target) return

    const expected = target.line.text
    const nextChar = expected[target.typed]

    if (char === nextChar) {
      target.typed++
      sfx.keyHit()
      if (target.typed >= expected.length) {
        // 完成一句
        target.status = 'completed'
        completedRef.current++
        comboRef.current++
        if (comboRef.current > maxComboRef.current) {
          maxComboRef.current = comboRef.current
        }

        // 时机评分：以该句的飘落窗口为基准，正点（到达判定线）成功率最高
        const elapsed = (performance.now() - startTimeRef.current) / 1000
        const fallDur = getFallDuration(target.line.text)
        const windowLength = fallDur + EXIT_SECONDS
        const progress = (elapsed - (target.line.time - fallDur)) / windowLength
        const perfectCenter = fallDur / windowLength
        const timingBonus = Math.abs(progress - perfectCenter) < PERFECT_RATIO / 2 ? 1.5 : 1.0

        const score = Math.round(100 * timingBonus)
        target.score = score
        scoreRef.current += score

        const perfect = timingBonus > 1.0
        emitFeedback(perfect ? 'perfect' : 'good')
        sfx.lineComplete(perfect)

        // 检查是否全部完成
        if (allDoneLyrics(lyricsRef.current)) {
          phaseRef.current = 'finished'
          if (intervalRef.current) clearInterval(intervalRef.current)
          sfx.gameOver()
        }
      }
    } else {
      scoreRef.current = Math.max(0, scoreRef.current - 30)
      comboRef.current = 0
      emitFeedback('wrong')
      sfx.wrong()
    }

    // 立即推送最新状态：最后一句完成时 interval 会被清除，
    // 若不在此渲染，React 将停留在上一帧（表现为"卡在最后一个字母"）
    setGameState(buildState((performance.now() - startTimeRef.current) / 1000))
  }, [emitFeedback, buildState])

  // 提前输入检查：歌词还未进入屏幕就打了它的首字符
  const checkEarlyInput = useCallback((char: string): boolean => {
    if (phaseRef.current !== 'playing') return false
    const hasFalling = lyricsRef.current.some(l => l.status === 'falling')
    if (hasFalling) return false // 有飘落中的歌词，交给 inputChar 正常处理

    const next = lyricsRef.current.find(l => l.status === 'pending')
    if (next && next.line.text[0] === char) {
      scoreRef.current = Math.max(0, scoreRef.current - 30)
      comboRef.current = 0
      emitFeedback('wrong')
      sfx.wrong()
      return true
    }
    return false
  }, [emitFeedback])

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