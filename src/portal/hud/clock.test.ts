import { describe, expect, it } from 'vitest'
import { formatClock } from './clock'

describe('formatClock', () => {
  it('Asia/Tokyo の曜日・日付・時刻', () => {
    // UTC 12:07 → 東京 21:07
    const c = formatClock(new Date('2026-10-04T12:07:00Z'), 'Asia/Tokyo')
    expect(c.weekday).toBe('Sunday')
    expect(c.date).toBe('Oct 04, 2026')
    expect(c.hour).toBe('21')
    expect(c.minute).toBe('07')
    expect(c.iso).toBe('2026-10-04T21:07')
  })

  it('午前0時は 24 ではなく 00（曜日と日付は翌日）', () => {
    // UTC 15:00 → 東京 翌日の 00:00
    const c = formatClock(new Date('2026-10-04T15:00:00Z'), 'Asia/Tokyo')
    expect(c.weekday).toBe('Monday')
    expect(c.date).toBe('Oct 05, 2026')
    expect(c.hour).toBe('00')
    expect(c.minute).toBe('00')
  })

  it('UTC で、1桁の日・時・分を0埋めする', () => {
    const c = formatClock(new Date('2026-03-05T00:05:00Z'), 'UTC')
    expect(c.weekday).toBe('Thursday')
    expect(c.date).toBe('Mar 05, 2026')
    expect(c.hour).toBe('00')
    expect(c.minute).toBe('05')
    expect(c.iso).toBe('2026-03-05T00:05')
  })
})
