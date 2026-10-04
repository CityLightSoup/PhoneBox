import * as THREE from 'three'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeElements, type ThreeEvent } from '@react-three/fiber'
import { useAnimations, useCursor, useGLTF } from '@react-three/drei'
import { PHONE_CLIP, PHONE_URL } from '../config'
import { usePortalStore } from '../state/portalStore'
import { keyAtPoint } from './keypad'
import { retroMaterials } from './retroMaterials'

type Btn = {
  obj: THREE.Object3D
  rest: THREE.Vector3
  dir: THREE.Vector3
  depth: number
  /** 0=戻っている 1=押し込まれている */
  t: number
}

/** これより大きいノードは、1つのボタンではない（モデル単位。実際のボタンは約0.26） */
const MAX_BUTTON_SIZE = 0.6

/** ボタンの初期位置。glbのシーンは使い回されるので、最初の位置を覚えておく */
const REST = new WeakMap<THREE.Object3D, THREE.Vector3>()

/** マテリアルを置き換え、ボタンを集め、前回の押し込み状態を元に戻す */
function prepare(scene: THREE.Object3D) {
  retroMaterials(scene)
  scene.updateMatrixWorld(true)
  const size = new THREE.Vector3()
  const buttons = new Map<string, Btn>()
  scene.traverse((o) => {
    if (o.userData.key === undefined) return
    // 軽量化でボタンが本体と結合されたノード（名前だけ btn_0 など）は、ボタンとして扱わない
    new THREE.Box3().setFromObject(o).getSize(size)
    if (Math.max(size.x, size.y, size.z) > MAX_BUTTON_SIZE) return
    if (!REST.has(o)) REST.set(o, o.position.clone())
    const rest = REST.get(o)!
    o.position.copy(rest)
    const d = (o.userData.press_dir as number[] | undefined) ?? [0, 0, 1]
    buttons.set(String(o.userData.key), {
      obj: o,
      rest,
      dir: new THREE.Vector3(d[0], d[1], d[2]),
      depth: Number(o.userData.press_depth ?? 0.03),
      t: 0,
    })
  })
  return buttons
}

const findUp = (o: THREE.Object3D | null, test: (o: THREE.Object3D) => boolean) => {
  for (; o; o = o.parent) if (test(o)) return o
  return null
}

export function Payphone(props: ThreeElements['group']) {
  const group = useRef<THREE.Group>(null!)
  const { scene, animations } = useGLTF(PHONE_URL, false)
  const { actions, mixer } = useAnimations(animations, group)
  const buttons = useMemo(() => prepare(scene), [scene])
  const phase = usePortalStore((s) => s.phase)
  const [hot, setHot] = useState(false)
  useCursor(hot && (phase === 'inside' || phase === 'offhook'))

  // 表示するたびに、受話器を「掛かった状態」に戻す（前回の最後の姿勢が残っているため）
  useEffect(() => {
    const a = actions[PHONE_CLIP]
    if (!a) {
      console.warn(`[Payphone] クリップ "${PHONE_CLIP}" がありません`)
      return
    }
    a.setLoop(THREE.LoopOnce, 1)
    a.clampWhenFinished = true
    a.reset().play()
    a.paused = true
    a.time = 0
    mixer.update(0)

    const onFinished = (e: { direction: number }) => {
      const s = usePortalStore.getState()
      if (e.direction > 0 && s.phase === 'lifting') s.setPhase('offhook')
      if (e.direction < 0 && s.phase === 'hangingup') s.setPhase('inside')
    }
    mixer.addEventListener('finished', onFinished)
    return () => mixer.removeEventListener('finished', onFinished)
  }, [actions, mixer])

  // 受話器を取る / 戻す
  useEffect(() => {
    const a = actions[PHONE_CLIP]
    const { setPhase } = usePortalStore.getState()
    if (!a) {
      if (phase === 'lifting') setPhase('offhook')
      if (phase === 'hangingup') setPhase('inside')
      return
    }
    if (phase === 'lifting') {
      a.reset()
      a.timeScale = 1
      a.play()
    } else if (phase === 'hangingup') {
      a.enabled = true
      a.paused = false
      a.timeScale = -1
      a.time = a.getClip().duration
      a.play()
    }
  }, [phase, actions])

  // ボタンの押し込み（なめらかに沈む）
  useFrame((_, dt) => {
    const held = usePortalStore.getState().heldKey
    buttons.forEach((b, key) => {
      const target = held === key ? 1 : 0
      if (b.t === target) return
      b.t = THREE.MathUtils.damp(b.t, target, 40, dt)
      if (Math.abs(b.t - target) < 0.005) b.t = target
      b.obj.position.copy(b.rest).addScaledVector(b.dir, -b.depth * b.t)
    })
  })

  const release = () => usePortalStore.getState().setHeldKey(null)

  /** クリックした位置にあるボタンのキー。ボタンの上でなければ null */
  const keyAt = (e: ThreeEvent<PointerEvent>): string | null => {
    // ボタンが別ノードのモデル
    const node = findUp(e.object, (o) => o.userData.key !== undefined && buttons.has(String(o.userData.key)))
    if (node) return String(node.userData.key)
    // ボタンが本体と結合されたモデル: 位置で判定する
    return keyAtPoint(scene.worldToLocal(e.point.clone()))
  }

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    const s = usePortalStore.getState()
    if (s.phase === 'inside') {
      e.stopPropagation()
      s.lift() // 電話機のどこをクリックしても受話器を取る
    } else if (s.phase === 'offhook') {
      const key = keyAt(e)
      if (key === null) return
      e.stopPropagation()
      s.setHeldKey(key)
      s.pressKey(key)
    }
  }

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    setHot(phase === 'inside' || (phase === 'offhook' && keyAt(e) !== null))
  }

  return (
    <group ref={group} {...props}>
      <primitive
        object={scene}
        onPointerDown={onPointerDown}
        // 電話機のクリックは、背後のボックスの「外をクリックした」扱いにしない
        onClick={(e: ThreeEvent<MouseEvent>) => e.stopPropagation()}
        onPointerUp={release}
        onPointerMove={onPointerMove}
        onPointerOut={() => {
          release()
          setHot(false)
        }}
      />
    </group>
  )
}

useGLTF.preload(PHONE_URL, false)
