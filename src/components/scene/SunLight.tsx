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
    const speed = intro === "done" ? 0.06 : 0.02;
    ref.current.position.set(Math.cos(t * speed) * 5, 1.6, Math.sin(t * speed) * 5);
  });

  // Brighter gift state so the cold rock reads clearly on first paint.
  const intensity = intro === "gift" ? 1.15 : 1.7;
  const ambient = intro === "gift" ? 0.55 : 0.16;
  return (
    <>
      <ambientLight intensity={ambient} color="#9fb8c8" />
      <directionalLight ref={ref} position={[3, 2, 3]} intensity={intensity} color="#fff4d8" />
    </>
  );
}
