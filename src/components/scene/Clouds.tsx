import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorld } from "@/game/store";
import { getToonGradient, INK } from "@/game/toon-gradient";

const COUNT = 22;

export function Clouds() {
  const water = useWorld((s) => s.water);
  const weather = useWorld((s) => s.weather);
  const ref = useRef<THREE.InstancedMesh>(null);
  const outlineRef = useRef<THREE.InstancedMesh>(null);
  const gradient = useMemo(() => getToonGradient(), []);

  const blueprints = useMemo(() => {
    const arr: { pos: THREE.Vector3; scale: number; speed: number }[] = [];
    for (let i = 0; i < COUNT; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 1.22;
      arr.push({
        pos: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta),
        ),
        scale: 0.07 + Math.random() * 0.05,
        speed: 0.04 + Math.random() * 0.04,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const dummy = new THREE.Object3D();
    const outlineDummy = new THREE.Object3D();
    const density = Math.max(water, weather === "rain" || weather === "storm" ? 0.9 : 0.3);
    const count = Math.floor(density * blueprints.length);
    for (let i = 0; i < blueprints.length; i++) {
      const b = blueprints[i];
      if (i < count) {
        const angle = t * b.speed;
        const p = b.pos.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        dummy.position.copy(p);
        dummy.lookAt(0, 0, 0);
        dummy.scale.setScalar(b.scale);
        dummy.updateMatrix();
        outlineDummy.position.copy(p);
        outlineDummy.lookAt(0, 0, 0);
        outlineDummy.scale.setScalar(b.scale * 1.12);
        outlineDummy.updateMatrix();
      } else {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        outlineDummy.scale.setScalar(0);
        outlineDummy.updateMatrix();
      }
      ref.current.setMatrixAt(i, dummy.matrix);
      outlineRef.current?.setMatrixAt(i, outlineDummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
    if (outlineRef.current) outlineRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={outlineRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color={INK} side={THREE.BackSide} />
      </instancedMesh>
      <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshToonMaterial gradientMap={gradient} color="#fafafa" />
      </instancedMesh>
    </group>
  );
}
