import { Suspense, useLayoutEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { CAMERA_FAR, CAMERA_NEAR } from '../config'
import { Hud } from '../portal/hud/Hud'
import { useCall, useDialTone, useKeyboardDial } from '../portal/hooks'
import { PixelStage, pixelDpr, usePixelSize } from '../portal/pixel'
import { PortalErrorBoundary } from '../portal/PortalErrorBoundary'
import { useDocumentTitle } from '../portal/useDocumentTitle'
import { Scene } from '../portal/Scene'
import { usePortalStore } from '../state/portalStore'

export default function PortalRoute() {
  const size = usePixelSize()
  useDocumentTitle()

  // 作品から戻ってきたときは inside から始める
  useLayoutEffect(() => usePortalStore.getState().normalizeOnMount(), [])
  useKeyboardDial()
  useDialTone()
  useCall()

  return (
    <PixelStage size={size}>
      <PortalErrorBoundary>
        {/* 内部解像度のバッファに描いて、CSSで拡大する（ドットのまま表示される） */}
        <Canvas
          flat
          dpr={pixelDpr(size)}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          camera={{ fov: 32.3, near: CAMERA_NEAR, far: CAMERA_FAR }}
          onPointerMissed={() => usePortalStore.getState().leave()}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
        <Hud />
      </PortalErrorBoundary>
    </PixelStage>
  )
}
