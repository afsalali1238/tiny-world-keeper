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

  const intensity = intro === "gift" ? 0.5 : 1.4;
  return (
    <>
      <ambientLight intensity={0.45} color="#dff0ec" />
      <directionalLight ref={ref} position={[3, 2, 3]} intensity={intensity} color="#fff4d8" />
    </>
  );
}
