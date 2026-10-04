import { useEffect, useState } from 'react'
import { DIAL_LENGTH, SITE } from '../../config'
import type { Phase } from '../../state/portalStore'
import { formatClock } from './clock'

/** 今の手順（SITE.steps の何番目か）。leaving は中にいる、closing は外に出た扱い */
const STEP: Record<Phase, number> = {
  exterior: 0,
  entering: 0,
  inside: 1,
  lifting: 1,
  hangingup: 1,
  offhook: 2,
  invalid: 2,
  ringing: 2,
  connected: 2,
  leaving: 1,
  closing: 0,
}

const STATUS: Record<Phase, string> = {
  exterior: 'Idle',
  entering: 'Entering',
  inside: 'On hook',
  lifting: 'Picking up',
  hangingup: 'Hanging up',
  offhook: 'Off hook',
  invalid: 'Not in service',
  ringing: 'Calling',
  connected: 'Connected',
  leaving: 'On hook',
  closing: 'Idle',
}

/** いまの時刻。毎秒、秒の切り替わりに合わせて更新する */
function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>
    const tick = () => {
      const d = new Date()
      setNow(d)
      id = setTimeout(tick, 1000 - d.getMilliseconds())
    }
    id = setTimeout(tick, 1000 - (Date.now() % 1000))
    return () => clearTimeout(id)
  }, [])
  return now
}

/** 左上: タイトル・罫線・補足 */
export function Masthead() {
  return (
    <header className="masthead">
      <h1>{SITE.title}</h1>
      <hr />
      <p className="tagline">{SITE.tagline}</p>
      <p className="meta">{SITE.intro}</p>
    </header>
  )
}

/** 右上: 時計 */
export function Clock() {
  const now = useNow()
  const c = formatClock(now, SITE.clockTimeZone)
  return (
    <div className="clock">
      <p className="meta">{SITE.clockTimeZone ?? 'Local time'}</p>
      <time className="clock-time" dateTime={c.iso}>
        {c.hour}
        {/* 消えても幅が変わらないよう、visibility で点滅させる */}
        <span className="clock-colon" data-off={now.getSeconds() % 2 === 1 ? '' : undefined}>
          :
        </span>
        {c.minute}
      </time>
      <hr />
      <time className="clock-date" dateTime={c.iso.slice(0, 10)}>
        {c.weekday}, {c.date}
      </time>
    </div>
  )
}

/** 左下: 手順。今=paper、終わった=khaki、これから=dim */
export function Steps({ phase }: { phase: Phase }) {
  const current = STEP[phase]
  return (
    <ol className="steps">
      {SITE.steps.map((text, i) => (
        <li key={text} className={i === current ? 'now' : i < current ? 'done' : 'next'}>
          <span className="step-no">{i + 1}</span>
          {text}
        </li>
      ))}
    </ol>
  )
}

/** 右下: 状態。受話器を取っているときだけ「Hang up」 */
export function Status({ phase, onHangUp }: { phase: Phase; onHangUp: () => void }) {
  const canHangUp = phase === 'offhook' || phase === 'invalid'
  return (
    <div className="status">
      <p className="meta">Status</p>
      <p className="status-text">{STATUS[phase]}</p>
      {canHangUp && (
        <button type="button" className="text-btn" onClick={onHangUp}>
          [Esc] Hang up
        </button>
      )}
    </div>
  )
}

/** 上中央: 入力中の番号 */
export function Dial({ digits }: { digits: string }) {
  return (
    <div className="dial">
      <p className="meta">Number</p>
      <div className="dial-cells" aria-label="Dialed number">
        {Array.from({ length: DIAL_LENGTH }, (_, i) => (
          <span key={i} className="dial-cell">
            {digits[i] ?? '_'}
          </span>
        ))}
      </div>
    </div>
  )
}
