import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { BG_COLOR, BOOTH, FLICKER, MODEL_SCALE, LIGHT } from "../config";
import { Booth } from "./Booth";
import { CameraRig } from "./CameraRig";
import { lamp } from "./flicker";
import { Payphone } from "./Payphone";

/** ボックス内の切れかけの蛍光灯。点滅に合わせて、環境光とボックス内の明かりを揺らす */
function BoothLamp() {
  const ambient = useRef<THREE.AmbientLight>(null!);
  const point = useRef<THREE.PointLight>(null!);

  useFrame(({ clock }) => {
    const level = lamp.update(clock.elapsedTime);
    ambient.current.intensity = LIGHT.ambient * (1 - FLICKER.ambientDip * (1 - level));
    point.current.intensity = LIGHT.booth * level;
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={LIGHT.ambient} />
      {/* 距離で弱まらない。届く範囲は distance=メートル */}
      <pointLight
        ref={point}
        position={[BOOTH.cx, 8, 3]}
        intensity={LIGHT.booth}
        distance={2.4}
        decay={0}
        color="#e8f5c8"
      />
    </>
  );
}

/** ライトの強さは three r155 以降の物理単位。実物を見て調整する */
export function Scene() {
  return (
    <>
      <color attach="background" args={[BG_COLOR]} />
      <fog attach="fog" args={[BG_COLOR, 6, 16]} />
      <directionalLight
        position={[3, 8, 12]}
        intensity={LIGHT.directional}
        color="#f2eed8"
      />

      {/* 電話機と電話ボックスは同じ座標系・同じ倍率で置く */}
      <group scale={MODEL_SCALE}>
        <mesh
          rotation-x={-Math.PI / 2}
          position={[BOOTH.cx, BOOTH.floorY - 0.7, 0]}
        >
          <planeGeometry args={[600, 600]} />
          <meshLambertMaterial color="#1f2118" />
        </mesh>
        <Booth />
        <Payphone />
        <BoothLamp />
      </group>

      <CameraRig />
    </>
  );
}
