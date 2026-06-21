import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { Planet } from "./Planet";
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
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.4, 4.6], fov: 30 }}
      gl={{ antialias: true }}
    >
      <SceneBackground />
      <Suspense fallback={null}>
        <SunLight />
        <Planet cold={intro === "gift"} />
        {intro !== "gift" && <Clouds />}
        {intro === "done" && <Aurora />}
        <ContactShadows position={[0, -1.2, 0]} opacity={0.25} scale={4} blur={2.6} far={2} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
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
