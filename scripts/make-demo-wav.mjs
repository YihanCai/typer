/**
 * 生成用于"音频同步测试"的哔哔声 WAV（无外部依赖）
 * 输出：public/music/beeps-demo.wav
 *
 * 在固定时间点发出 880Hz 短哔声，歌词时间戳与哔声一一对应，
 * 用于验证游戏时钟是否真正跟随音频播放进度
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const OUT = join(ROOT, 'public', 'music', 'beeps-demo.wav')

const SAMPLE_RATE = 44100
const DURATION = 16.5 // 秒
/** 哔声时间点（秒）—— 与歌词数据中的时间戳保持一致 */
const BEEPS = [1.0, 3.6, 6.2, 8.8, 11.4, 14.0]
const TONE_FREQ = 880
const BEEP_LEN = 0.18

const totalSamples = Math.floor(SAMPLE_RATE * DURATION)
const buf = Buffer.alloc(44 + totalSamples * 2)

// --- WAV 头部 ---
buf.write('RIFF', 0)
buf.writeUInt32LE(36 + totalSamples * 2, 4)
buf.write('WAVE', 8)
buf.write('fmt ', 12)
buf.writeUInt32LE(16, 16)          // PCM 块大小
buf.writeUInt16LE(1, 20)           // PCM 格式
buf.writeUInt16LE(1, 22)           // 单声道
buf.writeUInt32LE(SAMPLE_RATE, 24)
buf.writeUInt32LE(SAMPLE_RATE * 2, 28) // 字节率
buf.writeUInt16LE(2, 32)           // 块对齐
buf.writeUInt16LE(16, 34)          // 位深
buf.write('data', 36)
buf.writeUInt32LE(totalSamples * 2, 40)

// --- 采样 ---
for (let i = 0; i < totalSamples; i++) {
  const t = i / SAMPLE_RATE
  let s = 0
  for (const b of BEEPS) {
    const dt = t - b
    if (dt >= 0 && dt < BEEP_LEN) {
      // 余弦包络使其不爆音
      const env = (1 - Math.cos((dt / BEEP_LEN) * Math.PI)) / 2
      s += 0.6 * Math.sin(2 * Math.PI * TONE_FREQ * dt) * env
    }
  }
  buf.writeInt16LE(Math.max(-1, Math.min(1, s)) * 32767, 44 + i * 2)
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, buf)
console.log(`已生成 ${OUT}（${BEEPS.length} 声哔 @ ${BEEPS.join('/')}s）`)