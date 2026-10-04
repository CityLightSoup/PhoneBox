export type ClockParts = {
  /** 例: "Sunday" */
  weekday: string
  /** 例: "Oct 04, 2026" */
  date: string
  /** 例: "21"（0埋め。午前0時は "00"） */
  hour: string
  minute: string
  /** <time dateTime> に入れる値。例: "2026-10-04T21:07"（タイムゾーンなしのローカル表記） */
  iso: string
}

const formatters = new Map<string, { numeric: Intl.DateTimeFormat; month: Intl.DateTimeFormat }>()

function formattersFor(timeZone: string | undefined) {
  const key = timeZone ?? ''
  let f = formatters.get(key)
  if (!f) {
    f = {
      // hourCycle: 'h23' にしないと、環境によって午前0時が "24" になる
      numeric: new Intl.DateTimeFormat('en-US', {
        timeZone,
        weekday: 'long',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }),
      month: new Intl.DateTimeFormat('en-US', { timeZone, month: 'short' }),
    }
    formatters.set(key, f)
  }
  return f
}

/** 曜日・日付・時刻を、指定したタイムゾーン（省略時は端末の時刻）で整える */
export function formatClock(now: Date, timeZone?: string): ClockParts {
  const f = formattersFor(timeZone)
  const p: Record<string, string> = {}
  for (const part of f.numeric.formatToParts(now)) p[part.type] = part.value
  return {
    weekday: p.weekday,
    date: `${f.month.format(now)} ${p.day}, ${p.year}`,
    hour: p.hour,
    minute: p.minute,
    iso: `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`,
  }
}
