import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'

/** 作品のサンプル（R3F）。自分のWebGL作品に置き換える。Canvasはこのページ専用 */
function Spinner() {
  const ref = useRef<Mesh>(null!)
  useFrame((_, dt) => {
    ref.current.rotation.x += dt * 0.6
    ref.current.rotation.y += dt * 0.9
  })
  return (
    <mesh ref={ref}>
      <boxGeometry args={[1.4, 1.4, 1.4]} />
      <meshLambertMaterial color="#8fa86a" />
    </mesh>
  )
}

export default function DemoA() {
  return (
    <div className="work-fill">
      <Canvas dpr={0.5} gl={{ antialias: false }} camera={{ position: [0, 0, 4], fov: 40 }}>
        <color attach="background" args={['#14160f']} />
        <ambientLight intensity={1.2} />
        <directionalLight position={[2, 3, 4]} intensity={2.4} />
        <Spinner />
      </Canvas>
    </div>
  )
}
