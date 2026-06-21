import { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { buildPlanetGeometry } from "@/game/planet-geometry";
import { useWorld } from "@/game/store";
import { getToonGradient, INK } from "@/game/toon-gradient";
import { Diorama } from "./Diorama";
import { TouchEffects } from "./TouchEffects";

interface Props {
  cold?: boolean;
}

export function Planet({ cold = false }: Props) {
  const seed = useWorld((s) => s.seed);
  const warmth = useWorld((s) => s.warmth);
  const water = useWorld((s) => s.water);
  const intro = useWorld((s) => s.intro);
  const selectedTool = useWorld((s) => s.selectedTool);
  const applyToolAt = useWorld((s) => s.applyToolAt);

  const geom = useMemo(() => buildPlanetGeometry(seed), [seed]);
  const groupRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const gradient = useMemo(() => getToonGradient(), []);
  const glitchRef = useRef<{ next: number; until: number; axis: number }>({
    next: 0,
    until: 0,
    axis: 0,
  });

  const baseColors = useMemo(() => {
    const c = geom.attributes.color as THREE.BufferAttribute;
    return new Float32Array(c.array);
  }, [geom]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.04;
      const breathe = 1 + Math.sin(t * 0.7) * 0.006;
      // Render glitch: ~once every 3-6 minutes, scale.x desyncs by 0.04 for 180ms.
      // The world is rendered, and the rendering is fallible.
      const g = glitchRef.current;
      const nowMs = performance.now();
      if (g.next === 0) g.next = nowMs + 180_000 + Math.random() * 180_000;
      if (nowMs > g.next && intro === "done") {
        g.until = nowMs + 180;
        g.axis = Math.floor(Math.random() * 3);
        g.next = nowMs + 180_000 + Math.random() * 180_000;
      }
      const glitching = nowMs < g.until;
      groupRef.current.scale.setScalar(breathe);
      if (glitching) {
        const pop = 1 + 0.045;
        if (g.axis === 0) groupRef.current.scale.x = breathe * pop;
        else if (g.axis === 1) groupRef.current.scale.y = breathe * pop;
        else groupRef.current.scale.z = breathe * pop;
      }
    }

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

        if (lat > 0.78) {
          const meltAmt = warmth * Math.min(1, (lat - 0.78) * 5);
          const isSnowWhite = baseColors[i * 3] > 0.85;
          if (isSnowWhite && meltAmt > 0.3) {
            const isOceanBase = b > g;
            const targetR = isOceanBase ? 0.32 : 0.56;
            const targetG = isOceanBase ? 0.72 : 0.78;
            const targetB = isOceanBase ? 0.72 : 0.42;
            r = r + (targetR - r) * meltAmt * 0.65;
            g = g + (targetG - g) * meltAmt * 0.65;
            b = b + (targetB - b) * meltAmt * 0.65;
          }
        }
        const isOcean = baseColors[i * 3 + 2] > baseColors[i * 3 + 1];
        if (isOcean) {
          const tR = 0.34;
          const tG = 0.74;
          const tB = 0.74 + water * 0.05;
          r = r + (tR - r) * 0.5;
          g = g + (tG - g) * 0.5;
          b = b + (tB - b) * 0.5;
        }
        col.setXYZ(i, r, g, b);
      }
      col.needsUpdate = true;
    }
  });

  const showAtmo = !cold && intro !== "gift";

  const handlePlanetDown = (e: ThreeEvent<PointerEvent>) => {
    if (!selectedTool) return;
    if (intro === "gift" || intro === "name" || intro === "pour") return;
    e.stopPropagation();
    const local = e.point.clone();
    if (planetRef.current) planetRef.current.worldToLocal(local);
    applyToolAt([local.x, local.y, local.z]);
  };

  return (
    <group ref={groupRef}>
      {/* outline (inverted hull) */}
      <mesh geometry={geom} scale={1.025}>
        <meshBasicMaterial color={INK} side={THREE.BackSide} />
      </mesh>

      {/* planet surface with toon shading */}
      <mesh
        ref={planetRef}
        geometry={geom}
        castShadow
        receiveShadow
        onPointerDown={handlePlanetDown}
      >
        <meshToonMaterial vertexColors gradientMap={gradient} />
      </mesh>

      {showAtmo && (
        <mesh scale={1.08}>
          <icosahedronGeometry args={[1, 4]} />
          <meshBasicMaterial
            color={"#bfe7e2"}
            transparent
            opacity={0.07 + warmth * 0.04}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {intro !== "gift" && intro !== "name" && <Diorama geom={geom} />}
      {intro !== "gift" && intro !== "name" && <TouchEffects />}
    </group>
  );
}
