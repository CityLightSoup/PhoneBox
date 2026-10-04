import * as THREE from 'three'
import { EMISSIVE_MAX, MATERIAL_MODE } from '../config'

let gradient: THREE.DataTexture | null = null
/** トゥーン用の3段階の陰影 */
function toonGradient() {
  if (!gradient) {
    gradient = new THREE.DataTexture(new Uint8Array([70, 150, 255]), 3, 1, THREE.RedFormat)
    gradient.minFilter = gradient.magFilter = THREE.NearestFilter
    gradient.needsUpdate = true
  }
  return gradient
}

/**
 * glb内の MeshStandardMaterial を、軽い Lambert / Toon に置き換える（環境マップが要らなくなる）。
 * 置き換え済みのシーンに2回呼んでも何も起きない。
 */
export function retroMaterials(root: THREE.Object3D) {
  const cache = new Map<THREE.Material, THREE.Material>()

  const convert = (src: THREE.Material): THREE.Material => {
    const s = src as THREE.MeshStandardMaterial
    if (!s.isMeshStandardMaterial) return src
    const hit = cache.get(src)
    if (hit) return hit
    const params = {
      color: s.color.clone(),
      map: s.map,
      // emissive は (1,1,1) + emissiveMap で「光る場所だけ白」にしている。マップを落とすと全面が発光する
      emissive: s.emissive.clone(),
      emissiveMap: s.emissiveMap,
      alphaMap: s.alphaMap,
      aoMap: s.aoMap,
      emissiveIntensity: Math.min(s.emissiveIntensity, EMISSIVE_MAX),
      transparent: s.transparent,
      opacity: s.opacity,
      side: s.side,
      alphaTest: s.alphaTest,
      depthWrite: s.depthWrite,
      vertexColors: s.vertexColors,
    }
    const dst =
      MATERIAL_MODE === 'toon'
        ? new THREE.MeshToonMaterial({ ...params, gradientMap: toonGradient() })
        : new THREE.MeshLambertMaterial(params)
    dst.name = s.name
    cache.set(src, dst)
    return dst
  }

  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    m.material = Array.isArray(m.material) ? m.material.map(convert) : convert(m.material)
  })
}
