import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { KEYPAD } from '../config'
import { keyAtPoint } from './keypad'

describe('keyAtPoint', () => {
  it('各ボタンの中心で、そのキーを返す', () => {
    for (const [key, [x, y, z]] of Object.entries(KEYPAD.keys)) {
      expect(keyAtPoint(new THREE.Vector3(x, y, z))).toBe(key)
    }
  })

  it('ボタンの外（本体・ボタンの隙間・手前の物）は null', () => {
    expect(keyAtPoint(new THREE.Vector3(-6, 1, 1))).toBeNull()
    // 1 と 2 の間
    expect(keyAtPoint(new THREE.Vector3(-4.5225, 1.161, 0.988))).toBeNull()
    // 0 の真上だが、奥行きが違う（手前に来た受話器など）
    expect(keyAtPoint(new THREE.Vector3(-4.365, 0.333, 2))).toBeNull()
  })
})
