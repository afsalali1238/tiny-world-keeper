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

// Frames the planet so it always floats with calm space around it.
// We compute the camera distance so a sphere of radius PLANET_R fits inside
// the SMALLER screen dimension with HALO_RATIO of breathing room. On phones in
// portrait the limiting dimension is width, so this keeps the planet from
// overflowing the sides. The fit is applied THROUGH OrbitControls so the two
// never fight, and maxDistance is widened so the portrait fit is never clamped.
const PLANET_R = 1.25; // radius incl. atmosphere/aurora halo
const HALO_RATIO = 0.46; // 0..1 — fraction of viewport left as breathing room

function FitCamera({
  controlsRef,
}: {
  controlsRef: { current: any };
}) {
  const { camera, size } = useThree();
  const baseDist = useRef(camera.position.length());

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (!cam.isPerspectiveCamera) return;
    const aspect = size.width / size.height;
    const vTan = Math.tan((cam.fov * Math.PI) / 360);
    // distance needed so the planet fits vertically...
    const zVert = PLANET_R / (vTan * (1 - HALO_RATIO));
    // ...and horizontally (the binding constraint in portrait when aspect < 1).
    const zHoriz = PLANET_R / (vTan * aspect * (1 - HALO_RATIO));
    const z = Math.max(zVert, zHoriz);
    baseDist.current = z;

    const controls = controlsRef.current;
    if (controls) {
      // never let maxDistance clamp the computed fit (portrait needs more room)
      controls.maxDistance = Math.max(controls.maxDistance, z + 4);
      const dir = new THREE.Vector3()
        .subVectors(cam.position, controls.target)
        .normalize();
      cam.position.copy(controls.target).addScaledVector(dir, z);
      controls.update();
    } else {
      cam.position.setLength(z);
    }
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height, controlsRef]);

  // gentle "glass moment" pull-back, applied along the orbit distance so it
  // composes with rotation instead of only nudging the z component.
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const at = useWorld.getState().glassMomentAt;
    let targetDist = baseDist.current;
    if (at) {
      const t = (Date.now() - at) / 2600;
      const pull = Math.sin(Math.min(1, Math.max(0, t)) * Math.PI);
      targetDist = baseDist.current + pull * 2.6;
    }
    const v = new THREE.Vector3().subVectors(camera.position, controls.target);
    const curDist = v.length();
    const next = curDist + (targetDist - curDist) * 0.12;
    v.normalize();
    camera.position.copy(controls.target).addScaledVector(v, next);
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
  const controlsRef = useRef<any>(null);
  // A modest fixed fov reads as "tiny world in a bottle" rather than fisheye.
  // FitCamera then chooses the distance so the planet always leaves halo room.
  const fov = 34;
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.2, 5], fov }}
      gl={{ antialias: true }}
    >
      <SceneBackground />
      <Suspense fallback={null}>
        <SunLight />
        <Planet cold={cold} />
        {showClouds && <Clouds />}
        {intro === "done" && <Aurora />}
        {showSurface && <TouchEffects />}

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          minDistance={1.8}
          maxDistance={8}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.6}
        />
        <TickDriver />
        <FitCamera controlsRef={controlsRef} />
      </Suspense>
    </Canvas>
  );
}
