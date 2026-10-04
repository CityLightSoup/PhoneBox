import * as THREE from 'three'
import { DOOR_WAYPOINT_BACK, EXTERIOR_CAMERA, MODEL_SCALE as S, POV_NODE } from '../config'

export type Pose = { pos: THREE.Vector3; quat: THREE.Quaternion }

/** root（glbのシーン）を基準にした obj の姿勢。位置はワールド（メートル）に換算する */
export function poseInRoot(root: THREE.Object3D, obj: THREE.Object3D): Pose {
  const m = new THREE.Matrix4()
  for (let o: THREE.Object3D | null = obj; o && o !== root; o = o.parent) {
    o.updateMatrix()
    m.premultiply(o.matrix)
  }
  const pos = new THREE.Vector3()
  const quat = new THREE.Quaternion()
  m.decompose(pos, quat, new THREE.Vector3())
  return { pos: pos.multiplyScalar(S), quat }
}

/** 引きの視点・ドアの手前・POVカメラの3つの姿勢 */
export function computePoses(scene: THREE.Object3D) {
  const povNode = scene.getObjectByName(POV_NODE) as THREE.PerspectiveCamera | undefined
  let pov: Pose
  let fov = 32.3
  if (povNode) {
    pov = poseInRoot(scene, povNode)
    if (povNode.isPerspectiveCamera) fov = povNode.fov
  } else {
    console.warn(`[CameraRig] "${POV_NODE}" が見つからないので、メモにある値で代用します`)
    const c = new THREE.PerspectiveCamera()
    c.position.set(-5.0, 2.4, 7.0).multiplyScalar(S)
    c.lookAt(new THREE.Vector3(-5.0, 2.4, 0).multiplyScalar(S))
    pov = { pos: c.position.clone(), quat: c.quaternion.clone() }
  }

  const look = new THREE.PerspectiveCamera()
  look.position.set(...EXTERIOR_CAMERA.position).multiplyScalar(S)
  look.lookAt(new THREE.Vector3(...EXTERIOR_CAMERA.target).multiplyScalar(S))
  const ext: Pose = { pos: look.position.clone(), quat: look.quaternion.clone() }

  const door: Pose = {
    pos: pov.pos.clone().add(new THREE.Vector3(0, 0, DOOR_WAYPOINT_BACK * S)),
    quat: pov.quat.clone(),
  }
  return { ext, door, pov, fov }
}

export const ease = (t: number) => t * t * (3 - 2 * t)

export function place(camera: THREE.Camera, a: Pose, b: Pose, t: number) {
  camera.position.lerpVectors(a.pos, b.pos, t)
  camera.quaternion.copy(a.quat).slerp(b.quat, t)
}
