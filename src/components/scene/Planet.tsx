import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildPlanetGeometry, samplePlanetSurface } from "@/game/planet-geometry";
import { useWorld } from "@/game/store";

interface Props {
  cold?: boolean;
}

export function Planet({ cold = false }: Props) {
  const seed = useWorld((s) => s.seed);
  const warmth = useWorld((s) => s.warmth);
  const water = useWorld((s) => s.water);
  const life = useWorld((s) => s.life);
  const intro = useWorld((s) => s.intro);

  const geom = useMemo(() => buildPlanetGeometry(seed), [seed]);
  const samples = useMemo(() => samplePlanetSurface(geom, seed, 240), [geom, seed]);
  const groupRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const housesRef = useRef<THREE.InstancedMesh>(null);
  const treesRef = useRef<THREE.InstancedMesh>(null);
  const lightsRef = useRef<THREE.InstancedMesh>(null);

  // dynamic vertex colors based on warmth/water/life (snow melt, ocean fill)
  const baseColors = useMemo(() => {
    const c = geom.attributes.color as THREE.BufferAttribute;
    return new Float32Array(c.array);
  }, [geom]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.04;
      const breathe = 1 + Math.sin(t * 0.7) * 0.008;
      groupRef.current.scale.setScalar(breathe);
    }

    // gradually tint vertices based on warmth/water (snow melt + ocean tint)
    if (planetRef.current) {
      const col = planetRef.current.geometry.attributes.color as THREE.BufferAttribute;
      const pos = planetRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const v = new THREE.Vector3();
      for (let i = 0; i < col.count; i++) {
        v.fromBufferAttribute(pos, i).normalize();
        const lat = Math.abs(v.y);
        let r = baseColors[i * 3];
        let g = baseColors[i * 3 + 1];
        let b = baseColors[i * 3 + 2];
        // melt snow with warmth
        if (lat > 0.78) {
          const meltAmt = warmth * Math.min(1, (lat - 0.78) * 5);
          // base snow color near (0.95, 0.94, 0.9). Pull toward land/ocean as warmth rises
          const isSnowWhite = baseColors[i * 3] > 0.85;
          if (isSnowWhite && meltAmt > 0.3) {
            const targetR = b > g ? 0.3 : 0.5; // ocean blue or land green-ish
            const targetG = 0.62;
            const targetB = b > g ? 0.62 : 0.42;
            r = r + (targetR - r) * meltAmt * 0.6;
            g = g + (targetG - g) * meltAmt * 0.6;
            b = b + (targetB - b) * meltAmt * 0.6;
          }
        }
        // brighten oceans with water
        const isOcean = baseColors[i * 3 + 2] > baseColors[i * 3 + 1];
        if (isOcean) {
          const target = 0.5 + water * 0.2;
          b = b + (target - b) * 0.5;
        }
        col.setXYZ(i, r, g, b);
      }
      col.needsUpdate = true;
    }

    // populate houses/trees/lights based on life
    const houseCount = Math.floor(life * 80);
    const treeCount = Math.floor(life * 120);
    const lightCount = houseCount;

    if (housesRef.current) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < housesRef.current.count; i++) {
        if (i < houseCount && samples[i]) {
          const s = samples[i];
          dummy.position.copy(s.position).multiplyScalar(1.002);
          dummy.lookAt(0, 0, 0);
          dummy.rotateX(Math.PI / 2);
          const scl = 0.018 + Math.random() * 0.006;
          dummy.scale.set(scl, scl * 1.2, scl);
          dummy.updateMatrix();
        } else {
          dummy.position.set(0, 0, 0);
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
        }
        housesRef.current.setMatrixAt(i, dummy.matrix);
      }
      housesRef.current.instanceMatrix.needsUpdate = true;
    }

    if (treesRef.current) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < treesRef.current.count; i++) {
        const s = samples[(i + 40) % samples.length];
        if (i < treeCount && s) {
          dummy.position.copy(s.position).multiplyScalar(1.002);
          dummy.lookAt(0, 0, 0);
          dummy.rotateX(Math.PI / 2);
          const scl = 0.012 + Math.random() * 0.005;
          dummy.scale.set(scl, scl * 1.6, scl);
          dummy.updateMatrix();
        } else {
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
        }
        treesRef.current.setMatrixAt(i, dummy.matrix);
      }
      treesRef.current.instanceMatrix.needsUpdate = true;
    }

    if (lightsRef.current) {
      const dummy = new THREE.Object3D();
      // determine which hemisphere is night (opposite of light)
      const lightDir = new THREE.Vector3(2, 1.2, 1.8).normalize();
      for (let i = 0; i < lightsRef.current.count; i++) {
        const s = samples[i];
        if (i < lightCount && s) {
          // rotate sample by group rotation
          const worldSamplePos = s.position.clone();
          if (groupRef.current) {
            worldSamplePos.applyEuler(groupRef.current.rotation);
          }
          const facing = worldSamplePos.clone().normalize().dot(lightDir);
          const isNight = facing < -0.05;
          if (isNight) {
            dummy.position.copy(s.position).multiplyScalar(1.006);
            const scl = 0.008;
            dummy.scale.setScalar(scl);
            dummy.updateMatrix();
          } else {
            dummy.scale.setScalar(0);
            dummy.updateMatrix();
          }
        } else {
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
        }
        lightsRef.current.setMatrixAt(i, dummy.matrix);
      }
      lightsRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  const tint = cold || intro === "gift" ? new THREE.Color("#9aa3ad") : new THREE.Color("#ffffff");

  return (
    <group ref={groupRef}>
      <mesh ref={planetRef} geometry={geom} castShadow receiveShadow>
        <meshStandardMaterial vertexColors flatShading roughness={0.95} color={tint} />
      </mesh>

      {/* atmosphere */}
      {!cold && intro !== "gift" && (
        <mesh scale={1.06}>
          <icosahedronGeometry args={[1, 4]} />
          <meshBasicMaterial
            color={"#cfe6ff"}
            transparent
            opacity={0.08 + warmth * 0.08}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* houses */}
      <instancedMesh ref={housesRef} args={[undefined, undefined, 80]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#d8b58a" flatShading roughness={0.9} />
      </instancedMesh>

      {/* tree-ish cones */}
      <instancedMesh ref={treesRef} args={[undefined, undefined, 120]} frustumCulled={false}>
        <coneGeometry args={[0.6, 1.4, 5]} />
        <meshStandardMaterial color="#4f7a4a" flatShading roughness={0.9} />
      </instancedMesh>

      {/* night lights */}
      <instancedMesh ref={lightsRef} args={[undefined, undefined, 80]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color="#ffce7a" />
      </instancedMesh>
    </group>
  );
}
