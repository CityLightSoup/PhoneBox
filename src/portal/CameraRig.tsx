import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { APPROACH_SEC, CAMERA_FAR, CAMERA_NEAR, MOVE_IN_SEC, PHONE_URL } from '../config'
import { usePortalStore } from '../state/portalStore'
import { computePoses, ease, place } from './poses'

/**
 * 引きの視点 → ドアの手前 → POVカメラ の順にカメラを動かす。
 * 受話器のアニメーションはPOVカメラの耳元を基準に作られているので、終点はPOVカメラに正確に合わせる。
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const { scene } = useGLTF(PHONE_URL, false)
  const poses = useMemo(() => computePoses(scene), [scene])
  const anim = useRef({ stage: 'idle' as 'idle' | 'approach' | 'move' | 'back' | 'out', t: 0 })

  useLayoutEffect(() => {
    camera.fov = poses.fov
    camera.near = CAMERA_NEAR
    camera.far = CAMERA_FAR
    camera.updateProjectionMatrix()
    // exterior 以外で開いたとき（作品から戻ったとき）は、最初からPOVの位置にいる
    const start = usePortalStore.getState().phase === 'exterior' ? poses.ext : poses.pov
    camera.position.copy(start.pos)
    camera.quaternion.copy(start.quat)
  }, [camera, poses])

  useFrame((_, delta) => {
    const s = usePortalStore.getState()
    const a = anim.current
    const dt = Math.min(delta, 0.1)

    // ボックスから出る: POV → ドアの手前（ドアは開いたまま）→ ドアが閉まりながら引きの視点へ
    if (s.phase === 'leaving') {
      if (a.stage !== 'back') {
        a.stage = 'back'
        a.t = 0
      }
      a.t = Math.min(1, a.t + dt / MOVE_IN_SEC)
      place(camera, poses.pov, poses.door, ease(a.t))
      if (a.t >= 1) {
        a.stage = 'idle'
        s.setDoorOpen(false)
        s.setPhase('closing')
      }
      return
    }
    if (s.phase === 'closing') {
      if (a.stage !== 'out') {
        a.stage = 'out'
        a.t = 0
      }
      a.t = Math.min(1, a.t + dt / APPROACH_SEC)
      place(camera, poses.door, poses.ext, ease(a.t))
      if (a.t >= 1) {
        a.stage = 'idle'
        s.setPhase('exterior')
      }
      return
    }

    if (s.phase !== 'entering') {
      a.stage = 'idle'
      return
    }
    if (a.stage === 'idle') {
      a.stage = 'approach'
      a.t = 0
    }
    if (a.stage === 'approach') {
      a.t = Math.min(1, a.t + dt / APPROACH_SEC)
      place(camera, poses.ext, poses.door, ease(a.t))
      if (a.t >= 1 && s.doorOpen) {
        a.stage = 'move'
        a.t = 0
      }
    } else {
      a.t = Math.min(1, a.t + dt / MOVE_IN_SEC)
      place(camera, poses.door, poses.pov, ease(a.t))
      if (a.t >= 1) {
        a.stage = 'idle'
        s.setPhase('inside')
      }
    }
  })

  return null
}
