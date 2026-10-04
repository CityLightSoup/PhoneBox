import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { INTEGER_SCALE, RES_H } from '../config'

/** 内部解像度（ドットの数）と、それを画面に何倍で表示するか */
export type PixelSize = { k: number; w: number; h: number }

/**
 * 画面全体を、k 倍に拡大した内部解像度で埋める。
 * k は「画面の高さ ÷ RES_H」。内部の幅と高さは、画面を覆うように切り上げる（端が最大 k-1 px 切れる）。
 */
function calcSize(): PixelSize {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const raw = vh / RES_H
  const k = !INTEGER_SCALE || raw < 1 ? Math.max(raw, 0.25) : Math.round(raw)
  return { k, w: Math.ceil(vw / k), h: Math.ceil(vh / k) }
}

export function usePixelSize() {
  const [size, setSize] = useState(calcSize)
  useEffect(() => {
    const onResize = () =>
      setSize((prev) => {
        const next = calcSize()
        return next.k === prev.k && next.w === prev.w && next.h === prev.h ? prev : next
      })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

/**
 * w x h のゲーム画面を、画面いっぱいに k 倍で置く（はみ出た端は切れる）。
 * CSSの --k は、HUD（DOM）を同じ倍率で拡大するのに使い、--w / --h は HUD の内部解像度での大きさ。
 */
export function PixelStage({ size, children }: { size: PixelSize; children: ReactNode }) {
  const { k, w, h } = size
  const style = { width: w * k, height: h * k, '--k': k, '--w': w, '--h': h } as CSSProperties
  return (
    <div className="stage-wrap">
      <div className="stage" style={style}>
        {children}
      </div>
    </div>
  )
}

/**
 * Canvasのdprから w x h のバッファを得る。
 * three.js は floor(幅 * dpr) でバッファ幅を決めるので、浮動小数点の誤差で1px足りなくならないよう 0.5 だけ足す。
 */
export function pixelDpr({ k, w }: PixelSize) {
  return (w + 0.5) / (w * k)
}
