import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../audio/tones', () => ({ ensureAudio: vi.fn(), playDtmf: vi.fn() }))

import { clearDialTimers, usePortalStore } from './portalStore'
import { works } from '../works/registry'
import { DIAL_COMMIT_MS, INVALID_MS } from '../config'

const s = () => usePortalStore.getState()
const press = (...keys: string[]) => keys.forEach((k) => s().pressKey(k))

beforeEach(() => {
  vi.useFakeTimers()
  clearDialTimers()
  usePortalStore.setState({ phase: 'offhook', digits: '', heldKey: null, doorOpen: false })
})
afterEach(() => {
  clearDialTimers()
  vi.useRealTimers()
})

describe('ダイヤルの規則', () => {
  it('登録済みの番号は、3桁そろって1秒後に ringing になる', () => {
    press('1', '1', '1')
    expect(s().digits).toBe('111')
    vi.advanceTimersByTime(DIAL_COMMIT_MS - 1)
    expect(s().phase).toBe('offhook')
    vi.advanceTimersByTime(1)
    expect(s().phase).toBe('ringing')
    expect(s().digits).toBe('111') // 発信先の判定に使うので残す
  })

  it('登録されていない番号は、1秒後に invalid になり、さらに待つと入力が消えて offhook に戻る', () => {
    press('9', '9', '9')
    vi.advanceTimersByTime(DIAL_COMMIT_MS)
    expect(s().phase).toBe('invalid')
    vi.advanceTimersByTime(INVALID_MS)
    expect(s().phase).toBe('offhook')
    expect(s().digits).toBe('')
  })

  it('3桁そろったあと1秒以内に数字を押すと、破棄して新しい1桁目になる', () => {
    press('1', '1', '1')
    vi.advanceTimersByTime(500)
    press('2')
    expect(s().digits).toBe('2')
    vi.advanceTimersByTime(DIAL_COMMIT_MS * 2)
    expect(s().phase).toBe('offhook') // 1桁だけなので発信しない
    expect(s().digits).toBe('2')
  })

  it('* はいつでも入力を消し、発信待ちも取り消す', () => {
    press('1', '1', '1')
    press('*')
    expect(s().digits).toBe('')
    vi.advanceTimersByTime(DIAL_COMMIT_MS * 2)
    expect(s().phase).toBe('offhook')
  })

  it('# は何もしない', () => {
    press('1', '#', '2')
    expect(s().digits).toBe('12')
  })

  it('offhook 以外では入力を受け付けない', () => {
    for (const phase of ['exterior', 'inside', 'lifting', 'ringing', 'hangingup'] as const) {
      usePortalStore.setState({ phase, digits: '' })
      press('1')
      expect(s().digits).toBe('')
    }
  })

  it('受話器を置くと入力と発信待ちが取り消される', () => {
    press('1', '1', '1')
    s().hangUp()
    expect(s().phase).toBe('hangingup')
    expect(s().digits).toBe('')
    vi.advanceTimersByTime(DIAL_COMMIT_MS * 2)
    expect(s().phase).toBe('hangingup')
  })

  it('invalid の間でも受話器を置ける', () => {
    press('9', '9', '9')
    vi.advanceTimersByTime(DIAL_COMMIT_MS)
    s().hangUp()
    expect(s().phase).toBe('hangingup')
    vi.advanceTimersByTime(INVALID_MS * 2)
    expect(s().phase).toBe('hangingup')
  })
})

describe('フェーズの入口', () => {
  it('exterior のときだけ enter できる', () => {
    usePortalStore.setState({ phase: 'exterior' })
    s().enter()
    expect(s().phase).toBe('entering')
    s().enter()
    expect(s().phase).toBe('entering')
  })

  it('inside のときだけ lift できる', () => {
    usePortalStore.setState({ phase: 'exterior' })
    s().lift()
    expect(s().phase).toBe('exterior')
    usePortalStore.setState({ phase: 'inside' })
    s().lift()
    expect(s().phase).toBe('lifting')
  })

  it('ポータルを開き直したとき、途中の状態は inside にそろう（exterior はそのまま）', () => {
    usePortalStore.setState({ phase: 'connected', digits: '111' })
    s().normalizeOnMount()
    expect(s().phase).toBe('inside')
    expect(s().digits).toBe('')
    usePortalStore.setState({ phase: 'exterior' })
    s().normalizeOnMount()
    expect(s().phase).toBe('exterior')
  })
})

describe('作品の登録', () => {
  it('番号は3桁の数字で、重複していない', () => {
    const numbers = works.map((w) => w.number)
    expect(numbers.every((n) => /^\d{3}$/.test(n))).toBe(true)
    expect(new Set(numbers).size).toBe(numbers.length)
  })
})
