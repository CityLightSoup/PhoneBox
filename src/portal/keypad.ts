import type * as THREE from 'three'
import { KEYPAD } from '../config'

/** 電話機のローカル座標（モデル単位）の点が、どのボタンの上かを返す。ボタンの外なら null */
export function keyAtPoint(p: THREE.Vector3): string | null {
  for (const [key, [x, y, z]] of Object.entries(KEYPAD.keys)) {
    if (Math.abs(p.z - z) > KEYPAD.depthTolerance) continue
    if (Math.hypot(p.x - x, p.y - y) <= KEYPAD.radius) return key
  }
  return null
}
