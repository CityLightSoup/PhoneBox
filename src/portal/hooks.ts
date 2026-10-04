import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { RING_MIN_MS } from '../config'
import { startDialTone, startRingback } from '../audio/tones'
import { usePortalStore } from '../state/portalStore'
import { findWorkByNumber } from '../works/registry'

/** キーボード: 0-9 * # でダイヤル、Esc で受話器を置く */
export function useKeyboardDial() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      const s = usePortalStore.getState()
      if (e.key === 'Escape') s.hangUp()
      else if (/^[0-9*#]$/.test(e.key)) s.tapKey(e.key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

/** 発信音（受話器を取ってから最初の1桁まで） */
export function useDialTone() {
  const phase = usePortalStore((s) => s.phase)
  const noDigits = usePortalStore((s) => s.digits.length === 0)
  useEffect(() => {
    if (phase !== 'offhook' || !noDigits) return
    const tone = startDialTone()
    return () => tone.stop()
  }, [phase, noDigits])
}

/**
 * ringing になったら、呼出音を鳴らしながら作品のコードを先読みし、
 * 読み込みが終わって RING_MIN_MS 経ったら作品のページへ移動する。
 */
export function useCall() {
  const navigate = useNavigate()
  const phase = usePortalStore((s) => s.phase)
  const digits = usePortalStore((s) => s.digits)

  useEffect(() => {
    if (phase !== 'ringing') return
    const work = findWorkByNumber(digits)
    if (!work) return
    let cancelled = false
    const ring = startRingback()
    const wait = new Promise<void>((resolve) => setTimeout(resolve, RING_MIN_MS))
    // 読み込みに失敗しても移動する（作品ページ側でエラーを表示する）
    Promise.all([work.load().catch(() => undefined), wait]).then(() => {
      if (cancelled) return
      ring.stop()
      usePortalStore.getState().setPhase('connected')
      navigate(`/works/${work.slug}`)
    })
    return () => {
      cancelled = true
      ring.stop()
    }
  }, [phase, digits, navigate])
}
