import { FLICKER } from '../config'

const rand = (min: number, max: number) => min + Math.random() * (max - min)

type Segment = { end: number; level: number }

/**
 * 切れかけの蛍光灯の明るさ（0〜1）を返す関数を作る。
 * ふだんはほぼ点灯していて、ランダムな間隔で「消える/点く」を素早く繰り返す（バースト）。
 * バーストの最後に、少し長めに消えることがある。
 */
function createFlicker() {
  let queue: Segment[] = []
  let nextBurst = rand(FLICKER.gapMin, FLICKER.gapMax)

  const startBurst = (t: number) => {
    const toggles = Math.round(rand(FLICKER.togglesMin, FLICKER.togglesMax))
    const segs: Segment[] = []
    let cursor = t
    for (let i = 0; i < toggles; i++) {
      cursor += rand(0.03, 0.12)
      segs.push({ end: cursor, level: rand(0.05, 0.35) }) // 消える
      cursor += rand(0.03, 0.15)
      segs.push({ end: cursor, level: rand(0.7, 1) }) // 点く
    }
    if (Math.random() < FLICKER.longOffChance) {
      cursor += rand(0.25, 0.6)
      segs.push({ end: cursor, level: rand(0, 0.12) })
    }
    queue = segs
    nextBurst = cursor + rand(FLICKER.gapMin, FLICKER.gapMax)
  }

  return (t: number) => {
    if (queue.length === 0 && t >= nextBurst) startBurst(t)
    while (queue.length > 0 && t >= queue[0].end) queue.shift()
    if (queue.length > 0) return queue[0].level
    // 点灯中も、安定器が弱っているようにわずかに揺らぐ
    return 0.94 + 0.06 * Math.sin(t * 37) * Math.sin(t * 11)
  }
}

const next = createFlicker()

/** いまの蛍光灯の明るさ。Scene の BoothLamp が毎フレーム更新し、他の描画物（蛍光灯の管）が読む */
export const lamp = {
  level: 1,
  update(t: number) {
    this.level = next(t)
    return this.level
  },
}
