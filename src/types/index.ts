/** 歌词行 */
export interface LyricLine {
  id: number
  /** 歌词原文 */
  text: string
  /** 该句出现的时间点（秒） */
  time: number
  /** 该句持续判定窗口（秒） */
  duration: number
}

/** 歌曲 */
export interface Song {
  id: string
  title: string
  artist: string
  /** 歌词数据 */
  lyrics: LyricLine[]
  /** 可选：对应音频文件 URL。存在时游戏时钟跟随音频播放进度，歌词按真实时间戳同步 */
  audioSrc?: string
}

/** 歌词在游戏中的生命周期状态 */
export type LyricStatus =
  | 'pending'    // 还未进入屏幕
  | 'falling'    // 正在飘落（全程可输入）
  | 'completed'  // 已正确打出
  | 'missed'     // 滑出屏幕未完成

/** 游戏中的歌词实例（带运行时状态） */
export interface LyricState {
  line: LyricLine
  status: LyricStatus
  /** 已输入的正确字符数 */
  typed: number
  /** 该句得分 */
  score: number
}

/** 游戏阶段 */
export type GamePhase = 'idle' | 'playing' | 'paused' | 'finished'

/** 游戏全局状态 */
export interface GameState {
  phase: GamePhase
  song: Song | null
  currentTime: number
  lyrics: LyricState[]
  score: number
  combo: number
  maxCombo: number
  totalLines: number
  completedLines: number
  missedLines: number
}

/** 判定结果 */
export type JudgeResult = 'perfect' | 'good' | 'miss' | 'wrong'