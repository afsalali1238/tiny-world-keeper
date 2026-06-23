import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";

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

// Frames the planet so it always floats with calm space around it.
// We compute the camera Z so that a sphere of radius PLANET_R fits inside
// the smaller screen dimension with HALO_RATIO of breathing room — on phones
// in portrait this means the planet only fills ~55% of the screen height.
const PLANET_R = 1.25; // radius incl. atmosphere/aurora halo
const HALO_RATIO = 0.42; // 0..1 — fraction of viewport left as breathing room

function FitCamera() {
  const { camera, size } = useThree();
  const baseZ = useRef(camera.position.z);
  const targetZ = useRef(camera.position.z);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (!cam.isPerspectiveCamera) return;
    const aspect = size.width / size.height;
    const vTan = Math.tan((cam.fov * Math.PI) / 360);
    // distance needed so the planet fits vertically...
    const zVert = PLANET_R / (vTan * (1 - HALO_RATIO));
    // ...and horizontally (matters in portrait when aspect < 1).
    const zHoriz = PLANET_R / (vTan * aspect * (1 - HALO_RATIO));
    const z = Math.max(zVert, zHoriz);
    baseZ.current = z;
    targetZ.current = z;
  }, [camera, size.width, size.height]);

  useFrame(() => {
    const at = useWorld.getState().glassMomentAt;
    let target = baseZ.current;
    if (at) {
      const t = (Date.now() - at) / 2600;
      const pull = Math.sin(Math.min(1, Math.max(0, t)) * Math.PI);
      target = baseZ.current + pull * 2.6;
    }
    camera.position.z += (target - camera.position.z) * 0.12;
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
  const [vw, setVw] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1024));
  useEffect(() => {
    const on = () => setVw(window.innerWidth);
    window.addEventListener("resize", on);
    window.addEventListener("orientationchange", on);
    return () => {
      window.removeEventListener("resize", on);
      window.removeEventListener("orientationchange", on);
    };
  }, []);
  // Tiered framing so the planet always floats with breathing room.
  // Small phones need a much wider FOV + further pullback than tablets.
  const isPhone = vw < 480;
  const isNarrow = vw < 820;
  const camZ = isPhone ? 7.2 : isNarrow ? 5.6 : 3.6;
  const fov = isPhone ? 46 : isNarrow ? 38 : 32;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.2, camZ], fov }}
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
          minDistance={isPhone ? 4.0 : isNarrow ? 3.0 : 2.2}
          maxDistance={isPhone ? 9.0 : isNarrow ? 7.5 : 5.5}

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
