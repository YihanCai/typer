import type { LyricLine, Song } from '../../types'
import { getFallDuration, EXIT_SECONDS } from '../../game/timing'

/** 相邻歌词窗口之间的间隙（秒） */
const GAP = 0.6

/**
 * 根据歌词文本自动排布时间轴（保证窗口首尾相接、永不重叠）
 * 第 i 句开始 = 上一句窗口结束 + 间隙 + 本句飘落时长
 * 这样无论句长（飘落时长上限 8s）如何，下一句一定在上一句消失后才入场
 * 支持传 [text, gapSeconds] 手动调整某句前的节奏
 */
function buildLyrics(lines: Array<string | [string, number]>, leadIn = 0.5): LyricLine[] {
  let end = 0 // 上一句窗口结束时刻
  return lines.map((entry, i) => {
    const text = typeof entry === 'string' ? entry : entry[0]
    const gap = typeof entry === 'string' ? GAP : entry[1]
    const fallDur = getFallDuration(text)
    const time = i === 0 ? leadIn + fallDur : end + gap + fallDur
    const line: LyricLine = {
      id: i + 1,
      text,
      time: Math.round(time * 10) / 10,
      duration: Math.round(fallDur * 10) / 10,
    }
    end = time + EXIT_SECONDS
    return line
  })
}

/**
 * 将一首完整歌曲按歌词行数切分为 N 段，每段成为独立可玩的曲目
 * 时间轴各自重新生成，段落之间有独立的分数结算
 */
function makeSongParts(
  base: { id: string; title: string; artist: string; lines: string[] },
  partCount: number,
): Song[] {
  const size = Math.ceil(base.lines.length / partCount)
  return Array.from({ length: partCount }, (_, i) => {
    const chunk = base.lines.slice(i * size, Math.min((i + 1) * size, base.lines.length))
    if (chunk.length === 0) return null
    return {
      id: `${base.id}-p${i + 1}`,
      title: `${base.title} · 第${i + 1}/${partCount}段`,
      artist: base.artist,
      lyrics: buildLyrics(chunk),
    }
  }).filter((s): s is Song => s !== null)
}

export const songs: Song[] = [
  // ===== 测试曲：极简短词，固定时间轴，验证核心机制 =====
  {
    id: 'test-1',
    title: '快速测试',
    artist: 'Typer 测试',
    lyrics: [
      { id: 1, text: 'hello', time: 2.5, duration: 4.0 },
      { id: 2, text: 'world', time: 6.0, duration: 4.0 },
      { id: 3, text: 'typing', time: 9.5, duration: 4.0 },
      { id: 4, text: 'game', time: 13.0, duration: 4.0 },
      { id: 5, text: 'good', time: 16.5, duration: 4.0 },
      { id: 6, text: 'luck', time: 20.0, duration: 4.0 },
      { id: 7, text: 'fast', time: 23.5, duration: 4.0 },
      { id: 8, text: 'code', time: 27.0, duration: 4.0 },
    ],
  },

  // ===== 真实歌曲 =====
  // Yesterday 拆分为 3 段练习曲（每段独立结算，难度可控）
  ...makeSongParts({
    id: 'yesterday',
    title: 'Yesterday',
    artist: 'The Beatles',
    lines: [
      'Yesterday',
      'All my troubles seemed so far away',
      'Now it looks as though',
      "they're here to stay",
      'Oh I believe in yesterday',
      'Suddenly',
      "I'm not half the man I used to be",
      "There's a shadow hanging over me",
      'Oh yesterday came suddenly',
      'Why she had to go',
      "I don't know she wouldn't say",
      'I said something wrong',
      'Now I long for yesterday',
    ],
  }, 3),
  {
    id: 'hey-jude',
    title: 'Hey Jude',
    artist: 'The Beatles',
    lyrics: buildLyrics([
      "Hey Jude don't make it bad",
      'Take a sad song and make it better',
      'Remember to let her into your heart',
      'Then you can start to make it better',
      "Hey Jude don't be afraid",
      'You were made to go out and get her',
      'The minute you let her under your skin',
      'Then you begin to make it better',
      'And anytime you feel the pain',
      'Hey Jude refrain',
      "Don't carry the world upon your shoulders",
      "For well you know that it's a fool",
      'Who plays it cool',
      'By making his world a little colder',
    ]),
  },
  {
    id: 'counting-stars',
    title: 'Counting Stars',
    artist: 'OneRepublic',
    lyrics: buildLyrics([
      "Lately I've been I've been losing sleep",
      'Dreaming about the things that we could be',
      "But baby I've been I've been praying hard",
      'Said no more counting dollars',
      "We'll be counting stars",
      "Yeah we'll be counting stars",
      'I see this life like a swinging vine',
      'Swing my heart across the line',
      'In my face is flashing signs',
      'Seek it out and ye shall find',
      'Take that money watch it burn',
      'Sink in the river the lessons I learned',
    ]),
  },
  {
    id: 'viva-la-vida',
    title: 'Viva La Vida',
    artist: 'Coldplay',
    lyrics: buildLyrics([
      'I used to rule the world',
      'Seas would rise when I gave the word',
      'Now in the morning I sleep alone',
      'Sweep the streets I used to own',
      'I hear Jerusalem bells a ringing',
      'Roman cavalry choirs are singing',
      'Be my mirror my sword and shield',
      'My missionaries in a foreign field',
      "For some reason I can't explain",
      'Once you go there was never',
      'Never an honest word',
      'And that was when I ruled the world',
    ]),
  },
  {
    id: 'gloria',
    title: 'Gloria',
    artist: 'The Lumineers',
    lyrics: buildLyrics([
      'Gloria',
      "You think you're all alone",
      "But you're not alone",
      'Gloria',
      "You think you're all alone",
      "But you're not alone",
      'I found you in the rain',
      'Just a flower in my way',
      'Gloria',
      "Don't you lose your way",
      "Don't you lose your way",
      'Gloria',
    ]),
  },
]

export function getSongById(id: string): Song | undefined {
  return songs.find(s => s.id === id)
}