import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorld } from "@/game/store";

export function Clouds() {
  const water = useWorld((s) => s.water);
  const weather = useWorld((s) => s.weather);
  const ref = useRef<THREE.InstancedMesh>(null);

  const baseMatrices = useMemo(() => {
    const arr: { pos: THREE.Vector3; scale: number; speed: number }[] = [];
    for (let i = 0; i < 40; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 1.18;
      arr.push({
        pos: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta),
        ),
        scale: 0.08 + Math.random() * 0.06,
        speed: 0.04 + Math.random() * 0.05,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const dummy = new THREE.Object3D();
    const density = Math.max(water, weather === "rain" || weather === "storm" ? 0.9 : 0);
    const count = Math.floor(density * baseMatrices.length);
    for (let i = 0; i < baseMatrices.length; i++) {
      const b = baseMatrices[i];
      if (i < count) {
        // drift around y axis
        const angle = t * b.speed;
        const p = b.pos.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        dummy.position.copy(p);
        dummy.lookAt(0, 0, 0);
        dummy.scale.setScalar(b.scale);
        dummy.updateMatrix();
      } else {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
      }
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 40]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.55} depthWrite={false} />
    </instancedMesh>
  );
}
