/**
 * 打字游戏音效 —— 用 Web Audio API 实时合成，无需任何音频文件
 * 所有音效都是极短的振荡器波形：命中=短点，完成=上扬琶音，打错=低频蜂鸣，漏句=下坠滑音
 */

let ctx: AudioContext | null = null
let muted = false

/** 懒初始化 AudioContext；用户手势前可能处于 suspended，会尝试 resume */
function ensureCtx(): AudioContext | null {
  if (muted) return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
  return ctx
}

/** 播放一个基础音：起始频率、时长、波形、音量（可延迟 start） */
function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.15, delay = 0) {
  const c = ensureCtx()
  if (!c) return
  const t0 = c.currentTime + delay
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

export const sfx = {
  setMuted(m: boolean) {
    muted = m
  },
  isMuted(): boolean {
    return muted
  },

  /** 每打对一个字母：清脆短点（音量小，防止连打时烦人） */
  keyHit() {
    tone(1900, 0.04, 'square', 0.05)
  },

  /** 整句完成：PERFECT = 三连音上扬，GOOD = 双音上行 */
  lineComplete(perfect: boolean) {
    if (perfect) {
      tone(880, 0.12, 'sine', 0.16)
      tone(1108, 0.12, 'sine', 0.16, 0.09)
      tone(1320, 0.2, 'sine', 0.16, 0.18)
    } else {
      tone(660, 0.12, 'sine', 0.15)
      tone(880, 0.18, 'sine', 0.15, 0.1)
    }
  },

  /** 打错 / 提前输入：低频蜂鸣 */
  wrong() {
    tone(150, 0.18, 'sawtooth', 0.11)
  },

  /** 漏掉一句：下坠滑音 */
  miss() {
    const c = ensureCtx()
    if (!c) return
    const t0 = c.currentTime
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(420, t0)
    osc.frequency.exponentialRampToValueAtTime(150, t0 + 0.3)
    g.gain.setValueAtTime(0.12, t0)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3)
    osc.connect(g).connect(c.destination)
    osc.start(t0)
    osc.stop(t0 + 0.32)
  },

  /** 游戏结束：欢快收束 */
  gameOver() {
    tone(660, 0.12, 'triangle', 0.15)
    tone(880, 0.12, 'triangle', 0.15, 0.12)
    tone(1108, 0.12, 'triangle', 0.15, 0.24)
    tone(1320, 0.28, 'triangle', 0.15, 0.36)
  },
}