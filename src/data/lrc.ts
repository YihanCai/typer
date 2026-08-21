/**
 * LRC 歌词解析 —— 把标准 LRC 文本（[mm:ss.xx]歌词）转成带真实时间戳的行
 * 真实时间戳来自音频文件本身的秒数，用于音频驱动的歌词同步播放
 */

export interface LrcLineData {
  /** 该句在音频中的真实时间点（秒） */
  time: number
  text: string
}

/**
 * 解析 LRC 文本
 * 支持多时间标签（[00:01.00][00:05.00]歌词 = 同一句重复两次）
 * 忽略元数据标签（[ti:][ar:][al:] 等）与空行
 */
export function parseLRC(lrc: string): LrcLineData[] {
  const result: LrcLineData[] = []
  // 匹配 [mm:ss] 或 [mm:ss.xx] 或 [mm:ss.xxx]
  const tagRe = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g

  for (const rawLine of lrc.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue

    // 元数据标签行（无时间标签）
    if (!tagRe.test(line)) continue
    tagRe.lastIndex = 0 // 重置，上面用了 test

    const text = line.replace(/\[[^\]]*\]/g, '').trim()
    if (!text) continue

    tagRe.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = tagRe.exec(line)) !== null) {
      const minutes = parseInt(m[1], 10)
      const seconds = parseInt(m[2], 10)
      const frac = m[3] ?? '0'
      const ms = parseInt(frac.padEnd(3, '0').slice(0, 3), 10)
      result.push({ time: minutes * 60 + seconds + ms / 1000, text })
    }
  }

  return result.sort((a, b) => a.time - b.time)
}