import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useWorld } from "@/game/store";

export function SunLight() {
  const ref = useRef<THREE.DirectionalLight>(null);
  const intro = useWorld((s) => s.intro);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // Faster cycle once the world is alive (~70s per day) so the terminator
    // visibly sweeps across the planet and night-side lights appear on time.
    const speed = intro === "done" ? 0.09 : 0.02;
    ref.current.position.set(Math.cos(t * speed) * 5, 1.6, Math.sin(t * speed) * 5);
  });

  // Brighter gift state so the cold rock reads clearly on first paint.
  // Once alive, drop ambient so the night side is actually dark — that's
  // what makes the glowing settlements read.
  const intensity = intro === "gift" ? 1.15 : 1.85;
  const ambient = intro === "gift" ? 0.55 : 0.09;
  return (
    <>
      <ambientLight intensity={ambient} color="#6f8aa0" />
      <directionalLight ref={ref} position={[3, 2, 3]} intensity={intensity} color="#fff4d8" />
    </>
  );
}

