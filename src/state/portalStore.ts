import { create } from 'zustand'
import { DIAL_COMMIT_MS, DIAL_LENGTH, INVALID_MS } from '../config'
import { ensureAudio, playDtmf } from '../audio/tones'
import { findWorkByNumber } from '../works/registry'

export type Phase =
  | 'exterior' // 引きの視点。ボックスのクリック待ち
  | 'entering' // ドアが開き、カメラが中へ入る
  | 'inside' // POV視点。電話機のクリック待ち
  | 'lifting' // 受話器を取るアニメーション
  | 'offhook' // 受話器が耳元。ダイヤルできる
  | 'invalid' // 番号が違う（NOT IN SERVICE）
  | 'ringing' // 「Calling...」。作品を先読みしている
  | 'connected' // navigate 済み
  | 'hangingup' // 受話器を戻すアニメーション
  | 'leaving' // POV視点からドアの手前まで下がる（ドアはまだ開いている）
  | 'closing' // ドアが閉まりながら、引きの視点へ戻る

type PortalState = {
  phase: Phase
  /** 入力中の番号 */
  digits: string
  /** ドアが開ききったか（カメラが「中へ入る」タイミングの合図） */
  doorOpen: boolean
  /** 押し込まれて見えるボタン */
  heldKey: string | null

  setPhase: (phase: Phase) => void
  setDoorOpen: (open: boolean) => void
  setHeldKey: (key: string | null) => void
  /** ポータルを開き直したとき、途中の状態を inside にそろえる */
  normalizeOnMount: () => void

  enter: () => void
  /** 電話機の外をクリックして、ボックスから出る */
  leave: () => void
  lift: () => void
  hangUp: () => void
  /** ボタン1つ分の入力 */
  pressKey: (key: string) => void
  /** キーボードからの入力（ボタンが一瞬沈む） */
  tapKey: (key: string) => void
}

let dialTimer: ReturnType<typeof setTimeout> | null = null
let invalidTimer: ReturnType<typeof setTimeout> | null = null

export function clearDialTimers() {
  if (dialTimer) clearTimeout(dialTimer)
  if (invalidTimer) clearTimeout(invalidTimer)
  dialTimer = null
  invalidTimer = null
}

export const usePortalStore = create<PortalState>()((set, get) => {
  /** 3桁そろって1秒操作がなかったときの処理 */
  const commitDial = () => {
    dialTimer = null
    const { phase, digits } = get()
    if (phase !== 'offhook' || digits.length !== DIAL_LENGTH) return
    if (findWorkByNumber(digits)) {
      set({ phase: 'ringing' })
    } else {
      set({ phase: 'invalid' })
      invalidTimer = setTimeout(() => {
        invalidTimer = null
        if (get().phase === 'invalid') set({ phase: 'offhook', digits: '' })
      }, INVALID_MS)
    }
  }

  return {
    phase: 'exterior',
    digits: '',
    doorOpen: false,
    heldKey: null,

    setPhase: (phase) => set({ phase }),
    setDoorOpen: (doorOpen) => set({ doorOpen }),
    setHeldKey: (heldKey) => set({ heldKey }),

    normalizeOnMount: () => {
      clearDialTimers()
      if (get().phase !== 'exterior') set({ phase: 'inside', digits: '', heldKey: null })
    },

    enter: () => {
      if (get().phase !== 'exterior') return
      ensureAudio() // 最初のクリックで音を使えるようにする
      set({ phase: 'entering' })
    },

    leave: () => {
      if (get().phase !== 'inside') return
      set({ phase: 'leaving' })
    },

    lift: () => {
      if (get().phase !== 'inside') return
      set({ phase: 'lifting' })
    },

    hangUp: () => {
      const { phase } = get()
      if (phase !== 'offhook' && phase !== 'invalid') return
      clearDialTimers()
      set({ phase: 'hangingup', digits: '', heldKey: null })
    },

    pressKey: (key) => {
      if (get().phase !== 'offhook') return
      playDtmf(key)
      if (dialTimer) {
        clearTimeout(dialTimer)
        dialTimer = null
      }
      if (key === '*') {
        set({ digits: '' })
        return
      }
      if (key === '#') return // 今は何もしない（今後の拡張用）
      // 3桁そろったあとの1秒以内に押された場合は、破棄して新しい1桁目にする
      const base = get().digits.length >= DIAL_LENGTH ? '' : get().digits
      const digits = base + key
      set({ digits })
      if (digits.length === DIAL_LENGTH) dialTimer = setTimeout(commitDial, DIAL_COMMIT_MS)
    },

    tapKey: (key) => {
      if (get().phase !== 'offhook') return
      set({ heldKey: key })
      get().pressKey(key)
      setTimeout(() => {
        if (get().heldKey === key) set({ heldKey: null })
      }, 120)
    },
  }
})
