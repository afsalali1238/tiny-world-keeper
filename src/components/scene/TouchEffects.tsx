import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useWorld } from "@/game/store";
import type { TouchEffect } from "@/game/types";

const COLORS: Record<TouchEffect["kind"], string> = {
  rain: "#7fc7d4",
  sun: "#f6c879",
  wind: "#e8f2ee",
  seed: "#9ed27a",
};

function EffectMark({ e }: { e: TouchEffect }) {
  const ref = useRef<THREE.Group>(null);
  const [x, y, z] = e.pos;
  const normal = new THREE.Vector3(x, y, z).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

  useFrame(() => {
    if (!ref.current) return;
    const age = (Date.now() - e.bornAt) / 2000; // 0..1
    if (age >= 1) {
      ref.current.visible = false;
      return;
    }
    const lift = 0.04 + age * 0.18;
    ref.current.position.set(normal.x * (1 + lift), normal.y * (1 + lift), normal.z * (1 + lift));
    const s = 0.06 + age * 0.18;
    ref.current.scale.setScalar(s);
    const mat = (ref.current.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
    mat.opacity = 0.85 * (1 - age);
  });

  return (
    <group ref={ref} quaternion={quat}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 1, 24]} />
        <meshBasicMaterial color={COLORS[e.kind]} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function TouchEffects() {
  const effects = useWorld((s) => s.effects);
  return (
    <group>
      {effects.map((e) => (
        <EffectMark key={e.id} e={e} />
      ))}
    </group>
  );
}
