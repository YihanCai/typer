/**
 * 游戏计时参数 —— 供引擎与歌词数据共用
 */

/** 每字符的飘落耗时系数（秒/字符） */
const PER_CHAR_FALL = 0.35
/** 飘落时长下限（秒）—— 短词也至少给足辨识时间 */
const FALL_MIN = 2.2
/** 飘落时长上限（秒）—— 超长句仍需要玩家提速 */
const FALL_MAX = 8
/** 滑过判定线后、完全消失前的宽限期（秒），超时判 miss */
export const EXIT_SECONDS = 0.5
/** 完美判定的窗口比例（以飘落中点为准） */
export const PERFECT_RATIO = 0.3

/**
 * 根据歌词长度计算飘落窗口时长（秒）
 * 句越长给的时间越多，保证真实歌曲的完整句子也能打完
 */
export function getFallDuration(text: string): number {
  return Math.min(FALL_MAX, Math.max(FALL_MIN, text.length * PER_CHAR_FALL))
}