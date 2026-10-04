import * as THREE from 'three'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useAnimations, useCursor, useGLTF } from '@react-three/drei'
import { BOOTH, BOOTH_DOOR_CLIP, BOOTH_URL, DOOR_OPEN_SEC, USE_BOOTH_GLB } from '../config'
import { usePortalStore } from '../state/portalStore'
import { lamp } from './flicker'
import { retroMaterials } from './retroMaterials'

/** ドアが開いているべきフェーズ（leaving の間は開いたまま、closing で閉まる） */
const isDoorOpen = (phase: string) => phase !== 'exterior' && phase !== 'closing'

/** 電話ボックス全体。exterior のときだけクリックで中に入れる */
export function Booth() {
  const exterior = usePortalStore((s) => s.phase === 'exterior')
  const [hover, setHover] = useState(false)
  useCursor(hover && exterior)

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    const s = usePortalStore.getState()
    if (s.phase === 'exterior') {
      e.stopPropagation()
      s.enter()
    } else if (s.phase === 'inside') {
      // 電話機のクリックはここへ届かない（Payphone 側で止めている）ので、ここに来たのは電話機の外
      e.stopPropagation()
      s.leave()
    }
  }

  return (
    <group onClick={onClick} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
      {USE_BOOTH_GLB ? <BoothGlb /> : <BoothPlaceholder />}
    </group>
  )
}

// ------------------------------------------------------------------ glb版
/** 書き出したglb。クリップ DoorOpen を LoopOnce で再生してドアを開ける */
function BoothGlb() {
  const group = useRef<THREE.Group>(null!)
  const { scene, animations } = useGLTF(BOOTH_URL, false)
  const { actions, mixer } = useAnimations(animations, group)
  const open = usePortalStore((s) => isDoorOpen(s.phase))
  const started = useRef(false)
  useMemo(() => retroMaterials(scene), [scene])

  // 初期状態（開いた状態で表示するときは、最初から開ききった姿勢にする）
  useEffect(() => {
    const { setDoorOpen } = usePortalStore.getState()
    const a = actions[BOOTH_DOOR_CLIP]
    if (!a) {
      console.warn(`[Booth] クリップ "${BOOTH_DOOR_CLIP}" がありません`)
      return
    }
    a.setLoop(THREE.LoopOnce, 1)
    a.clampWhenFinished = true
    a.reset().play()
    a.paused = true
    const alreadyOpen = usePortalStore.getState().phase !== 'exterior'
    a.time = alreadyOpen ? a.getClip().duration : 0
    mixer.update(0)
    if (alreadyOpen) {
      started.current = true
      setDoorOpen(true)
    }
    // 閉じる向きの再生が終わったときは何もしない
    const onFinished = (e: { direction: number }) => {
      if (e.direction > 0) usePortalStore.getState().setDoorOpen(true)
    }
    mixer.addEventListener('finished', onFinished)
    return () => mixer.removeEventListener('finished', onFinished)
  }, [actions, mixer])

  // ドアを開ける / 閉める
  useEffect(() => {
    const a = actions[BOOTH_DOOR_CLIP]
    if (!open) {
      if (!started.current) return
      started.current = false
      if (!a) return
      a.enabled = true
      a.paused = false
      a.timeScale = -1
      a.time = a.getClip().duration
      a.play()
      return
    }
    if (started.current) return
    started.current = true
    if (!a) {
      const id = setTimeout(() => usePortalStore.getState().setDoorOpen(true), DOOR_OPEN_SEC * 1000)
      return () => clearTimeout(id)
    }
    a.paused = false
    a.timeScale = 1
    a.time = 0
    a.play()
  }, [open, actions])

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  )
}

// ------------------------------------------------------------------ 仮の電話ボックス
// glbができるまでの代用。公衆電話と同じ座標系（モデル単位）で、折れ戸が開く。
const { cx, floorY, height, backZ, depth, width, opening, doorHeight } = BOOTH
const frontZ = backZ + depth
const leafW = opening / 2
const FRAME = '#2e4a36'
const GLASS = '#a9c7b0'
const TUBE_ON = new THREE.Color('#eaf3c8')
const TUBE_OFF = new THREE.Color('#2a2e22')

function Box({
  p,
  s,
  color,
  glass,
}: {
  p: [number, number, number]
  s: [number, number, number]
  color: string
  glass?: boolean
}) {
  return (
    <mesh position={p}>
      <boxGeometry args={s} />
      <meshLambertMaterial color={color} transparent={glass} opacity={glass ? 0.22 : 1} depthWrite={!glass} />
    </mesh>
  )
}

/** 折れ戸の1枚。原点が蝶番の位置で、+X方向に板が伸びる */
function Leaf() {
  const bar = 0.35
  return (
    <group>
      <Box p={[leafW / 2, doorHeight / 2, 0]} s={[leafW - 0.1, doorHeight - 0.1, 0.06]} color={GLASS} glass />
      <Box p={[bar / 2, doorHeight / 2, 0]} s={[bar, doorHeight, 0.3]} color={FRAME} />
      <Box p={[leafW - bar / 2, doorHeight / 2, 0]} s={[bar, doorHeight, 0.3]} color={FRAME} />
      <Box p={[leafW / 2, doorHeight - bar / 2, 0]} s={[leafW, bar, 0.3]} color={FRAME} />
      <Box p={[leafW / 2, bar / 2, 0]} s={[leafW, bar, 0.3]} color={FRAME} />
    </group>
  )
}

function BoothPlaceholder() {
  const open = usePortalStore((s) => isDoorOpen(s.phase))
  const t = useRef(open ? 1 : 0)
  const reported = useRef(open)
  const leafA = useRef<THREE.Group>(null!)
  const leafB = useRef<THREE.Group>(null!)
  const tube = useRef<THREE.MeshBasicMaterial>(null!)

  useLayoutEffect(() => {
    if (open) usePortalStore.getState().setDoorOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame((_, delta) => {
    const target = open ? 1 : 0
    t.current = THREE.MathUtils.clamp(
      t.current + Math.sign(target - t.current) * (Math.min(delta, 0.1) / DOOR_OPEN_SEC),
      0,
      1,
    )
    const e = t.current * t.current * (3 - 2 * t.current)
    // 1枚目が蝶番を軸に外側へ開き、2枚目がその先で折り返して重なる
    leafA.current.rotation.y = -e * Math.PI * 0.48
    leafB.current.rotation.y = e * Math.PI * 0.96
    tube.current.color.copy(TUBE_OFF).lerp(TUBE_ON, lamp.level)
    if (!open) reported.current = false // 閉まったあと、次に開ききったときにまた知らせる
    if (open && t.current >= 1 && !reported.current) {
      reported.current = true
      usePortalStore.getState().setDoorOpen(true)
    }
  })

  const topY = floorY + height
  const doorTopY = floorY + doorHeight
  const midY = floorY + height / 2
  const x0 = cx - width / 2
  const x1 = cx + width / 2

  return (
    <group>
      {/* 床・天井 */}
      <Box p={[cx, floorY - 0.3, backZ + depth / 2]} s={[width + 0.8, 0.6, depth + 0.8]} color="#2a2a22" />
      <Box p={[cx, topY + 0.3, backZ + depth / 2]} s={[width + 0.8, 0.6, depth + 0.8]} color={FRAME} />
      {/* 奥の壁（電話機が付く） */}
      <Box p={[cx, midY, backZ - 0.1]} s={[width, height, 0.2]} color="#3d4d3c" />
      {/* 左右のガラス */}
      <Box p={[x0, midY, backZ + depth / 2]} s={[0.1, height, depth]} color={GLASS} glass />
      <Box p={[x1, midY, backZ + depth / 2]} s={[0.1, height, depth]} color={GLASS} glass />
      {/* 四隅の柱 */}
      {[x0, x1].flatMap((x) =>
        [backZ, frontZ].map((z) => <Box key={`${x}-${z}`} p={[x, midY, z]} s={[0.5, height, 0.5]} color={FRAME} />),
      )}
      {/* ドアの上の枠 */}
      <Box p={[cx, (doorTopY + topY) / 2, frontZ]} s={[width, topY - doorTopY, 0.5]} color={FRAME} />
      {/* 天井の蛍光灯（切れかけで点滅する） */}
      <mesh position={[cx, topY - 0.1, backZ + depth / 2]}>
        <boxGeometry args={[4, 0.1, 1.2]} />
        <meshBasicMaterial ref={tube} color={TUBE_ON} />
      </mesh>
      {/* 折れ戸 */}
      <group ref={leafA} position={[cx - opening / 2, floorY, frontZ]}>
        <Leaf />
        <group ref={leafB} position={[leafW, 0, 0]}>
          <Leaf />
        </group>
      </group>
    </group>
  )
}
