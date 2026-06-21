import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorld } from "@/game/store";

export function Aurora() {
  const weather = useWorld((s) => s.weather);
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.1;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.3;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    const target = weather === "aurora" ? 0.35 : 0;
    mat.opacity += (target - mat.opacity) * 0.04;
  });

  return (
    <mesh ref={ref} scale={1.22}>
      <torusGeometry args={[1, 0.06, 8, 64]} />
      <meshBasicMaterial color="#9be7c5" transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
