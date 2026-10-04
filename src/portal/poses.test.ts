import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { computePoses, poseInRoot } from './poses'

/** メモの値（位置 (-5.0, 2.4, 7.0)、yfov 0.563rad）でPOVカメラを持つ疑似glb */
function fakePhoneScene(parentOffset = new THREE.Vector3()) {
  const root = new THREE.Group()
  const holder = new THREE.Group()
  holder.position.copy(parentOffset)
  const pov = new THREE.PerspectiveCamera(THREE.MathUtils.radToDeg(0.563), 16 / 9, 0.1, 1000)
  pov.name = 'POV_Camera'
  pov.position.set(-5.0, 2.4, 7.0)
  holder.add(pov)
  root.add(holder)
  return root
}

const forward = (q: THREE.Quaternion) => new THREE.Vector3(0, 0, -1).applyQuaternion(q)

describe('カメラの姿勢', () => {
  it('POVカメラの位置は、モデル単位の値を実物大（0.1倍）にしたものになる', () => {
    const { pov, fov } = computePoses(fakePhoneScene())
    expect(pov.pos.x).toBeCloseTo(-0.5)
    expect(pov.pos.y).toBeCloseTo(0.24)
    expect(pov.pos.z).toBeCloseTo(0.7)
    expect(fov).toBeCloseTo(32.26, 1)
  })

  it('POVカメラの親ノードの位置も反映される', () => {
    const root = fakePhoneScene(new THREE.Vector3(1, 0, 0))
    const pov = root.getObjectByName('POV_Camera')!
    expect(poseInRoot(root, pov).pos.x).toBeCloseTo(-0.4)
  })

  it('ドアの手前は、POVの真後ろ（+Z側）で、向きはPOVと同じ', () => {
    const { door, pov } = computePoses(fakePhoneScene())
    expect(door.pos.x).toBeCloseTo(pov.pos.x)
    expect(door.pos.y).toBeCloseTo(pov.pos.y)
    expect(door.pos.z).toBeCloseTo(pov.pos.z + 1.3)
    expect(door.quat.angleTo(pov.quat)).toBeCloseTo(0)
  })

  it('引きの視点は、電話ボックスの方（-Z）を向いている', () => {
    const { ext } = computePoses(fakePhoneScene())
    const f = forward(ext.quat)
    expect(f.z).toBeLessThan(-0.9)
    expect(ext.pos.z).toBeGreaterThan(5)
  })

  it('POVカメラがなくてもメモの値で代用する', () => {
    const { pov } = computePoses(new THREE.Group())
    expect(pov.pos.z).toBeCloseTo(0.7)
  })
})
