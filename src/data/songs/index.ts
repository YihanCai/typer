import type { Song } from '../../types'

/**
 * 测试用数据 —— 极简文本，验证核心机制
 * 每句 2.5s 飘落 + 4s 输入窗口，间隔 3.5s
 * 第一句 time=2.5s，保证完整看到飘落动画
 */
export const songs: Song[] = [
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
]

export function getSongById(id: string): Song | undefined {
  return songs.find(s => s.id === id)
}