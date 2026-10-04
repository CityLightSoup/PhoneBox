import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { usePortalStore } from '../../state/portalStore'
import { Clock, Dial, Masthead, Status, Steps } from './Blocks'

/** 画面に重ねるUI。内部解像度（PixelStage の --w x --h）の座標で書き、--k 倍に拡大して表示する */
export function Hud() {
  const phase = usePortalStore((s) => s.phase)
  const digits = usePortalStore((s) => s.digits)
  const hangUp = usePortalStore((s) => s.hangUp)
  const { active, progress } = useProgress()
  const loading = active || progress < 100
  const showDial = phase === 'offhook' || phase === 'invalid'

  return (
    <div className="hud">
      <div className="hud-inner">
        {!loading && (
          <>
            <Masthead />
            <Clock />
            <Steps phase={phase} />
            <Status phase={phase} onHangUp={hangUp} />
            {showDial && <Dial digits={digits} />}
            {phase === 'invalid' && <p className="notice">NOT IN SERVICE</p>}
          </>
        )}
        {/* 発信中は、上のブロックの上から画面いっぱいに覆う */}
        {!loading && phase === 'ringing' && <Calling />}
        {loading && <Loading progress={progress} />}
      </div>
    </div>
  )
}

/** 発信中。画面いっぱいにテキストを出す */
function Calling() {
  const [dots, setDots] = useState(1)
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d % 3) + 1), 350)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="calling">
      <span>
        Calling<span className="calling-dots">{'.'.repeat(dots)}</span>
      </span>
    </div>
  )
}

function Loading({ progress }: { progress: number }) {
  const filled = Math.round(progress / 10)
  return (
    <div className="loading">
      <p>Loading</p>
      <p className="loading-bar">
        [{'#'.repeat(filled)}
        {'-'.repeat(10 - filled)}] {Math.round(progress)}%
      </p>
    </div>
  )
}
