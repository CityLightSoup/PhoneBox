/**
 * 音はすべてWeb Audioで合成する（音声ファイルなし）。
 * ブラウザの制限で、最初のクリックのあとでないと鳴らない（ensureAudio を最初のクリックで呼ぶ）。
 */

let ctx: AudioContext | null = null

export function ensureAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

const ROWS = [697, 770, 852, 941]
const COLS = [1209, 1336, 1477]
const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']

/** 押したボタンの「ピッ」（2つの正弦波の和） */
export function playDtmf(key: string) {
  const c = ensureAudio()
  const i = KEYPAD.indexOf(key)
  if (!c || i < 0) return
  const now = c.currentTime
  const gain = c.createGain()
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.1, now + 0.005)
  gain.gain.setValueAtTime(0.1, now + 0.09)
  gain.gain.linearRampToValueAtTime(0, now + 0.13)
  gain.connect(c.destination)
  for (const f of [ROWS[Math.floor(i / 3)], COLS[i % 3]]) {
    const o = c.createOscillator()
    o.frequency.value = f
    o.connect(gain)
    o.start(now)
    o.stop(now + 0.14)
  }
}

export type Tone = { stop: () => void }
const silent: Tone = { stop: () => {} }

/** 発信音（日本は400Hzの連続音） */
export function startDialTone(): Tone {
  const c = ensureAudio()
  if (!c) return silent
  const now = c.currentTime
  const gain = c.createGain()
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.05, now + 0.03)
  gain.connect(c.destination)
  const o = c.createOscillator()
  o.frequency.value = 400
  o.connect(gain)
  o.start(now)
  return {
    stop() {
      const t = c.currentTime
      gain.gain.cancelScheduledValues(t)
      gain.gain.setValueAtTime(gain.gain.value, t)
      gain.gain.linearRampToValueAtTime(0, t + 0.03)
      o.stop(t + 0.05)
    },
  }
}

/** 呼出音（日本は400Hzを16Hzで変調したものを、1秒鳴らして2秒止める） */
export function startRingback(): Tone {
  const c = ensureAudio()
  if (!c) return silent
  const t0 = c.currentTime + 0.02

  const env = c.createGain()
  env.gain.value = 0
  const am = c.createGain()
  am.gain.value = 0.5
  const carrier = c.createOscillator()
  carrier.frequency.value = 400
  const lfo = c.createOscillator()
  lfo.frequency.value = 16
  const lfoDepth = c.createGain()
  lfoDepth.gain.value = 0.5

  lfo.connect(lfoDepth)
  lfoDepth.connect(am.gain)
  carrier.connect(am)
  am.connect(env)
  env.connect(c.destination)

  for (let i = 0; i < 20; i++) {
    env.gain.setValueAtTime(0.08, t0 + i * 3)
    env.gain.setValueAtTime(0, t0 + i * 3 + 1)
  }
  carrier.start(t0)
  lfo.start(t0)

  return {
    stop() {
      const t = c.currentTime
      env.gain.cancelScheduledValues(t)
      env.gain.setTargetAtTime(0, t, 0.01)
      carrier.stop(t + 0.1)
      lfo.stop(t + 0.1)
    },
  }
}
