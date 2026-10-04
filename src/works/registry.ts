import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { DIAL_LENGTH } from '../config'

export type Work = {
  /** ダイヤルする番号（DIAL_LENGTH桁の数字） */
  number: string
  /** URLの /works/:slug */
  slug: string
  title: string
  load: () => Promise<{ default: ComponentType }>
}

/**
 * 作品の一覧。作品を足すときは src/works/<slug>/index.tsx を作って、ここに1行足す。
 * number はダミー。実際の作品に合わせて変えること。
 */
export const works: Work[] = [
  { number: '001', slug: 'demo', title: 'Demo', load: () => import('./demo') },
  { number: '111', slug: 'demo-a', title: 'Demo A (R3F)', load: () => import('./demo-a') },
  { number: '222', slug: 'demo-b', title: 'Demo B (DOM)', load: () => import('./demo-b') },
]

export const findWorkByNumber = (number: string) => works.find((w) => w.number === number)
export const findWorkBySlug = (slug: string) => works.find((w) => w.slug === slug)

/** slugごとの lazy コンポーネント（作るたびに別物にならないよう、ここで1回だけ作る） */
export const workComponents = new Map<string, LazyExoticComponent<ComponentType>>(
  works.map((w) => [w.slug, lazy(w.load)]),
)

if (import.meta.env.DEV) {
  const seen = new Set<string>()
  for (const w of works) {
    if (!new RegExp(`^\\d{${DIAL_LENGTH}}$`).test(w.number)) {
      console.error(`[registry] "${w.slug}" の番号 "${w.number}" は ${DIAL_LENGTH} 桁の数字ではありません`)
    }
    if (seen.has(w.number)) console.error(`[registry] 番号 "${w.number}" が重複しています`)
    seen.add(w.number)
  }
}
