import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useWorld } from "@/game/store";
import type { TouchEffect } from "@/game/types";

const COLORS: Record<TouchEffect["kind"], string> = {
  rain: "#7fc7d4",
  sun: "#ffd271",
  wind: "#e8f2ee",
  seed: "#9ed27a",
};

const DURATION_MS = 1800;

function EffectMark({ e }: { e: TouchEffect }) {
  const groupRef = useRef<THREE.Group>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Group>(null);
  const [x, y, z] = e.pos;
  const normal = useMemo(() => new THREE.Vector3(x, y, z).normalize(), [x, y, z]);
  const quat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal),
    [normal],
  );
  const color = useMemo(() => new THREE.Color(COLORS[e.kind]), [e.kind]);

  // Per-effect deterministic particle seeds
  const particles = useMemo(() => {
    const count =
      e.kind === "rain" ? 6 : e.kind === "sun" ? 8 : e.kind === "seed" ? 5 : 4;
    return Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + (e.id % 7) * 0.3;
      return {
        ax: Math.cos(a),
        az: Math.sin(a),
        speed: 0.5 + ((e.id + i) % 5) * 0.12,
      };
    });
  }, [e.id, e.kind]);

  useFrame(() => {
    const age = (Date.now() - e.bornAt) / DURATION_MS; // 0..1
    if (!groupRef.current) return;
    if (age >= 1) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;
    const ease = 1 - Math.pow(1 - age, 2.2);

    // outer expanding ring
    if (ring1.current) {
      const s = 0.08 + ease * 0.42;
      ring1.current.scale.setScalar(s);
      const lift = 0.012 + ease * 0.04;
      ring1.current.position.set(normal.x * lift, normal.y * lift, normal.z * lift);
      const m = ring1.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.95 * (1 - age);
    }
    // inner bright pulse — pops in fast, fades slower
    if (ring2.current) {
      const popT = Math.min(1, age * 3);
      const s = 0.05 + popT * 0.22;
      ring2.current.scale.setScalar(s);
      const lift = 0.02 + ease * 0.025;
      ring2.current.position.set(normal.x * lift, normal.y * lift, normal.z * lift);
      const m = ring2.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.9 * (1 - age * age);
    }
    // particles (drops / rays / sprouts / streaks)
    if (particlesRef.current) {
      particlesRef.current.children.forEach((child, i) => {
        const p = particles[i];
        if (!p) return;
        const m = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        const t = Math.min(1, age * p.speed * 2.4);
        // local plane offset (tangent to surface)
        const radial = e.kind === "rain" ? -0.08 + t * 0.22 : 0.04 + t * 0.32;
        const upOff =
          e.kind === "rain"
            ? 0.35 * (1 - t) // falls toward surface
            : e.kind === "seed"
              ? t * 0.18 // sprouts upward
              : e.kind === "sun"
                ? 0.02 + t * 0.08
                : 0.02 + t * 0.12;
        child.position.set(p.ax * radial, upOff, p.az * radial);
        const sc =
          e.kind === "rain"
            ? 0.025 * (1 - age * 0.4)
            : e.kind === "sun"
              ? 0.03 + t * 0.04
              : e.kind === "seed"
                ? 0.018 + t * 0.04
                : 0.02;
        child.scale.setScalar(sc);
        m.opacity = (1 - age) * 0.85;
      });
    }
  });

  return (
    <group ref={groupRef} quaternion={quat}>
      {/* expanding outer ring */}
      <mesh ref={ring1} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
        <ringGeometry args={[0.55, 1, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          depthWrite={false}
          depthTest={true}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      {/* bright inner pulse */}
      <mesh ref={ring2} rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
        <ringGeometry args={[0.0, 0.7, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          depthWrite={false}
          depthTest={true}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      {/* kind-specific particles */}
      <group ref={particlesRef}>
        {particles.map((_, i) => (
          <mesh key={i} renderOrder={5}>
            {e.kind === "seed" ? (
              <coneGeometry args={[0.4, 1, 6]} />
            ) : e.kind === "sun" ? (
              <boxGeometry args={[0.2, 0.05, 1]} />
            ) : (
              <sphereGeometry args={[0.5, 6, 6]} />
            )}
            <meshBasicMaterial
              color={color}
              transparent
              depthWrite={false}
              depthTest={false}
              toneMapped={false}
              blending={e.kind === "sun" ? THREE.AdditiveBlending : THREE.NormalBlending}
            />
          </mesh>
        ))}
      </group>
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
