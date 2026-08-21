/**
 * 从 lrclib.net 抓取歌曲的 LRC 同步歌词（真实时间戳）
 * 用法：
 *   node scripts/fetch-lrc.mjs "The Beatles" "Yesterday"
 *   node scripts/fetch-lrc.mjs "Artist" "Title" --save  # 保存到 public/music/*.lrc
 *
 * lrclib 要求自定义 User-Agent，详见 https://lrclib.net/docs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))

const [artist = '', title = ''] = process.argv.slice(2).filter(a => a !== '--save')
const save = process.argv.includes('--save')

if (!artist || !title) {
  console.error('用法: node scripts/fetch-lrc.mjs "歌手" "歌名" [--save]')
  process.exit(1)
}

const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`

const res = await fetch(url, {
  headers: {
    'User-Agent': 'Typer (https://github.com/YihanCai/typer) lyric-typing-game',
    'Accept': 'application/json',
  },
})

if (!res.ok) {
  console.error(`请求失败: HTTP ${res.status}（可能未收录，或需要降低精确匹配）`)
  process.exit(1)
}

const data = await res.json()
console.log(`找到: ${data.artistName} — ${data.trackName} (${Math.round(data.duration)}s)`)

if (!data.syncedLyrics) {
  console.error('该条目没有同步 LRC 歌词')
  process.exit(1)
}

console.log('--- LRC ---')
console.log(data.syncedLyrics)

if (save) {
  const out = join(ROOT, 'public', 'music', `${data.trackName.replace(/\s+/g, '-').toLowerCase()}.lrc`)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, data.syncedLyrics, 'utf8')
  console.log(`已保存: ${out}`)
}