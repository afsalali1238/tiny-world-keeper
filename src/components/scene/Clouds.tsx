import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorld } from "@/game/store";
import { getToonGradient, INK } from "@/game/toon-gradient";

// Each "cloud" is 3 overlapping puffs. CLOUDS controls how many clouds exist.
const CLOUDS = 9;
const PUFFS_PER_CLOUD = 3;
const COUNT = CLOUDS * PUFFS_PER_CLOUD;

interface Puff {
  basis: THREE.Vector3; // unit vector — cloud anchor on sphere
  offset: THREE.Vector3; // tangent-plane offset for this puff
  scale: number;
  speed: number;
}

export function Clouds() {
  const water = useWorld((s) => s.water);
  const weather = useWorld((s) => s.weather);
  const ref = useRef<THREE.InstancedMesh>(null);
  const outlineRef = useRef<THREE.InstancedMesh>(null);
  const gradient = useMemo(() => getToonGradient(), []);

  const puffs = useMemo<Puff[]>(() => {
    const arr: Puff[] = [];
    for (let c = 0; c < CLOUDS; c++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const basis = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta),
      );
      // build a tangent basis on the sphere for this cloud
      const up = Math.abs(basis.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const tX = new THREE.Vector3().crossVectors(up, basis).normalize();
      const tY = new THREE.Vector3().crossVectors(basis, tX).normalize();
      const baseScale = 0.11 + Math.random() * 0.05;
      const speed = 0.035 + Math.random() * 0.03;
      for (let p = 0; p < PUFFS_PER_CLOUD; p++) {
        // 3 puffs in a small clump: center + two flankers
        const dx = (p - 1) * (0.09 + Math.random() * 0.04);
        const dy = (Math.random() - 0.5) * 0.04;
        const offset = tX.clone().multiplyScalar(dx).add(tY.clone().multiplyScalar(dy));
        const puffScale = baseScale * (p === 1 ? 1.0 : 0.78 + Math.random() * 0.12);
        arr.push({ basis, offset, scale: puffScale, speed });
      }
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const dummy = new THREE.Object3D();
    const outlineDummy = new THREE.Object3D();
    const density = Math.max(water, weather === "rain" || weather === "storm" ? 0.9 : 0.35);
    const liveClouds = Math.floor(density * CLOUDS);
    const liveCount = liveClouds * PUFFS_PER_CLOUD;
    const yAxis = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < puffs.length; i++) {
      const p = puffs[i];
      if (i < liveCount) {
        const angle = t * p.speed;
        const anchor = p.basis.clone().applyAxisAngle(yAxis, angle);
        const off = p.offset.clone().applyAxisAngle(yAxis, angle);
        const world = anchor.clone().multiplyScalar(1.27).add(off);
        // re-project to sit higher above the surface so clouds read as weather, not debris
        world.setLength(1.28 + (anchor.y > 0 ? 0.01 : 0));

        dummy.position.copy(world);
        dummy.lookAt(0, 0, 0);
        // flatten vertically so puffs read as clouds, not orbs
        dummy.scale.set(p.scale * 1.3, p.scale * 0.55, p.scale);
        dummy.updateMatrix();
      } else {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
      }
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  const tint = weather === "rain" || weather === "storm" ? "#dbe2e6" : "#ffffff";

  return (
    <group>
      <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial
          color={tint}
          transparent
          opacity={weather === "rain" || weather === "storm" ? 0.78 : 0.62}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
}
