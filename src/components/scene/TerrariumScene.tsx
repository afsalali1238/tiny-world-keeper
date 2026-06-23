import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { Planet } from "./Planet";
import { TouchEffects } from "./TouchEffects";

import { Clouds } from "./Clouds";
import { Aurora } from "./Aurora";
import { SunLight } from "./SunLight";
import { useWorld } from "@/game/store";
import { BACKGROUND_TEAL } from "@/game/toon-gradient";

function TickDriver() {
  const tick = useWorld((s) => s.tick);
  useFrame((_, dt) => {
    const speed = useWorld.getState().speed;
    tick(dt * speed);
  });
  return null;
}

function GlassCamera() {
  const { camera } = useThree();
  const baseZ = useRef(camera.position.z);
  useFrame(() => {
    const at = useWorld.getState().glassMomentAt;
    if (!at) {
      // ease back to base
      camera.position.z += (baseZ.current - camera.position.z) * 0.06;
      return;
    }
    const t = (Date.now() - at) / 2600; // 0..1 over duration
    // pull back then return: a bell curve
    const pull = Math.sin(Math.min(1, Math.max(0, t)) * Math.PI);
    const target = baseZ.current + pull * 2.6;
    camera.position.z += (target - camera.position.z) * 0.15;
  });
  return null;
}

function SceneBackground() {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color(BACKGROUND_TEAL);
  }, [scene]);
  return null;
}

export function TerrariumScene() {
  const intro = useWorld((s) => s.intro);
  const cold = intro === "gift" || intro === "warm";
  const showClouds = intro === "seed" || intro === "name" || intro === "done";
  const showSurface = intro !== "gift" && intro !== "name";
  const isNarrow = typeof window !== "undefined" && window.innerWidth < 720;
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.2, isNarrow ? 5.2 : 3.35], fov: isNarrow ? 36 : 32 }}
      gl={{ antialias: true }}
    >
      <SceneBackground />
      <Suspense fallback={null}>
        <SunLight />
        <Planet cold={cold} />
        {showClouds && <Clouds />}
        {intro === "done" && <Aurora />}
        {showSurface && <TouchEffects />}

        {/* contact shadow removed — was reading as a grey placeholder disc under the planet */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1.6}
          maxDistance={4.5}
          zoomSpeed={0.6}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.6}
        />
        <TickDriver />
        <GlassCamera />
      </Suspense>
    </Canvas>
  );
}
