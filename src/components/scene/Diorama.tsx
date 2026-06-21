import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { samplePlanetSurface, type PlanetSample } from "@/game/planet-geometry";
import { useWorld } from "@/game/store";
import { getToonGradient, INK, HOUSE_PALETTE, ROOF_PALETTE } from "@/game/toon-gradient";

const HOUSE_CAP = 90;
const TREE_CAP = 160;
const ROCK_CAP = 40;
const LIGHT_CAP = 90;
const TOTAL = HOUSE_CAP + TREE_CAP + ROCK_CAP;

interface Props {
  geom: THREE.BufferGeometry;
}

interface Slot {
  sample: PlanetSample;
  kind: "house" | "tree" | "rock";
  scale: number;
  yaw: number;
  treeSpecies: 0 | 1;
  houseColor: THREE.Color;
  roofColor: THREE.Color;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Diorama({ geom }: Props) {
  const seed = useWorld((s) => s.seed);
  const lifeRef = useRef(useWorld.getState().life);

  // subscribe to life without re-rendering every tick
  useEffect(() => {
    lifeRef.current = useWorld.getState().life;
    return useWorld.subscribe((s) => {
      lifeRef.current = s.life;
    });
  }, []);


  const slots = useMemo<Slot[]>(() => {
    const samples = samplePlanetSurface(geom, seed, TOTAL);
    const r = rng(seed + 99);
    return samples.map((sample, i): Slot => {
      let kind: Slot["kind"];
      if (i < HOUSE_CAP) kind = "house";
      else if (i < HOUSE_CAP + TREE_CAP) kind = "tree";
      else kind = "rock";
      return {
        sample,
        kind,
        scale: 0.02 + r() * 0.012,
        yaw: r() * Math.PI * 2,
        treeSpecies: r() > 0.5 ? 0 : 1,
        houseColor: new THREE.Color(HOUSE_PALETTE[Math.floor(r() * HOUSE_PALETTE.length)]),
        roofColor: new THREE.Color(ROOF_PALETTE[Math.floor(r() * ROOF_PALETTE.length)]),
      };
    });
  }, [geom, seed]);

  const houses = slots.filter((s) => s.kind === "house");
  const trees = slots.filter((s) => s.kind === "tree");
  const rocks = slots.filter((s) => s.kind === "rock");

  // refs
  const houseBodyRef = useRef<THREE.InstancedMesh>(null);
  const houseBodyOutlineRef = useRef<THREE.InstancedMesh>(null);
  const houseRoofRef = useRef<THREE.InstancedMesh>(null);
  const houseRoofOutlineRef = useRef<THREE.InstancedMesh>(null);
  const broadleafRef = useRef<THREE.InstancedMesh>(null);
  const broadleafOutlineRef = useRef<THREE.InstancedMesh>(null);
  const pineRef = useRef<THREE.InstancedMesh>(null);
  const pineOutlineRef = useRef<THREE.InstancedMesh>(null);
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const rockRef = useRef<THREE.InstancedMesh>(null);
  const rockOutlineRef = useRef<THREE.InstancedMesh>(null);
  const lightsRef = useRef<THREE.InstancedMesh>(null);

  const gradient = useMemo(() => getToonGradient(), []);

  // set per-instance colors once
  useMemo(() => {
    requestAnimationFrame(() => {
      if (houseBodyRef.current) {
        houses.forEach((s, i) => houseBodyRef.current!.setColorAt(i, s.houseColor));
        if (houseBodyRef.current.instanceColor) houseBodyRef.current.instanceColor.needsUpdate = true;
      }
      if (houseRoofRef.current) {
        houses.forEach((s, i) => houseRoofRef.current!.setColorAt(i, s.roofColor));
        if (houseRoofRef.current.instanceColor) houseRoofRef.current.instanceColor.needsUpdate = true;
      }
    });
  }, [houses]);

  useFrame(() => {
    const life = lifeRef.current;
    const houseCount = Math.min(houses.length, Math.floor(life * houses.length * 1.6));
    const treeCount = Math.min(trees.length, Math.floor(life * trees.length * 1.8));
    const rockCount = Math.min(rocks.length, Math.floor((0.2 + life) * rocks.length));

    const dummy = new THREE.Object3D();
    const outlineDummy = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);

    const writeAlignedMatrix = (
      mesh: THREE.InstancedMesh | null,
      outline: THREE.InstancedMesh | null,
      i: number,
      sample: PlanetSample,
      scale: THREE.Vector3,
      offsetAlongNormal: number,
      yaw: number,
      visible: boolean,
      outlineScale = 1.12,
    ) => {
      if (!mesh) return;
      if (!visible) {
        dummy.scale.setScalar(0);
        dummy.position.set(0, 0, 0);
        dummy.quaternion.identity();
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        if (outline) {
          outlineDummy.scale.setScalar(0);
          outlineDummy.position.set(0, 0, 0);
          outlineDummy.quaternion.identity();
          outlineDummy.updateMatrix();
          outline.setMatrixAt(i, outlineDummy.matrix);
        }
        return;
      }
      const n = sample.normal;
      const q = new THREE.Quaternion().setFromUnitVectors(up, n);
      const yawQ = new THREE.Quaternion().setFromAxisAngle(up, yaw);
      const finalQ = q.multiply(new THREE.Quaternion().setFromAxisAngle(up, yaw));
      // recompute: rotate around local up after aligning
      finalQ.identity();
      finalQ.copy(q);
      finalQ.multiply(yawQ);

      const pos = sample.position.clone().add(n.clone().multiplyScalar(offsetAlongNormal));
      dummy.position.copy(pos);
      dummy.quaternion.copy(finalQ);
      dummy.scale.copy(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      if (outline) {
        outlineDummy.position.copy(pos);
        outlineDummy.quaternion.copy(finalQ);
        outlineDummy.scale.copy(scale).multiplyScalar(outlineScale);
        outlineDummy.updateMatrix();
        outline.setMatrixAt(i, outlineDummy.matrix);
      }
    };

    // houses
    houses.forEach((s, i) => {
      const visible = i < houseCount;
      const bodyScale = new THREE.Vector3(s.scale * 1.2, s.scale * 1.1, s.scale * 1.1);
      writeAlignedMatrix(
        houseBodyRef.current,
        houseBodyOutlineRef.current,
        i,
        s.sample,
        bodyScale,
        s.scale * 0.55,
        s.yaw,
        visible,
        1.1,
      );
      // roof sits on top of body
      const roofScale = new THREE.Vector3(s.scale * 1.5, s.scale * 0.9, s.scale * 1.5);
      writeAlignedMatrix(
        houseRoofRef.current,
        houseRoofOutlineRef.current,
        i,
        s.sample,
        roofScale,
        s.scale * 1.55,
        s.yaw + Math.PI / 4,
        visible,
        1.08,
      );
    });

    // trees
    trees.forEach((s, i) => {
      const visible = i < treeCount;
      const isPine = s.treeSpecies === 1;
      // trunk
      const trunkScale = new THREE.Vector3(s.scale * 0.3, s.scale * 0.8, s.scale * 0.3);
      writeAlignedMatrix(
        trunkRef.current,
        null,
        i,
        s.sample,
        trunkScale,
        s.scale * 0.4,
        s.yaw,
        visible,
      );
      // foliage
      const foliageScale = isPine
        ? new THREE.Vector3(s.scale * 1.0, s.scale * 1.7, s.scale * 1.0)
        : new THREE.Vector3(s.scale * 1.2, s.scale * 1.2, s.scale * 1.2);
      const foliageOffset = isPine ? s.scale * 1.5 : s.scale * 1.3;
      const targetMesh = isPine ? pineRef.current : broadleafRef.current;
      const targetOutline = isPine ? pineOutlineRef.current : broadleafOutlineRef.current;
      writeAlignedMatrix(
        targetMesh,
        targetOutline,
        i,
        s.sample,
        foliageScale,
        foliageOffset,
        s.yaw,
        visible,
        1.1,
      );
      // hide on the other species mesh
      const otherMesh = isPine ? broadleafRef.current : pineRef.current;
      const otherOutline = isPine ? broadleafOutlineRef.current : pineOutlineRef.current;
      writeAlignedMatrix(
        otherMesh,
        otherOutline,
        i,
        s.sample,
        new THREE.Vector3(0, 0, 0),
        0,
        0,
        false,
      );
    });

    // rocks
    rocks.forEach((s, i) => {
      const visible = i < rockCount;
      const sc = new THREE.Vector3(s.scale * 0.8, s.scale * 0.5, s.scale * 0.8);
      writeAlignedMatrix(
        rockRef.current,
        rockOutlineRef.current,
        i,
        s.sample,
        sc,
        s.scale * 0.2,
        s.yaw,
        visible,
        1.15,
      );
    });

    // night lights — one per house, only on night side. Bigger + a halo so they read at distance.
    const lightDir = new THREE.Vector3(2, 1.2, 1.8).normalize();
    const parentRot = (lightsRef.current?.parent?.parent?.rotation as THREE.Euler) ?? new THREE.Euler();
    houses.forEach((s, i) => {
      if (i >= LIGHT_CAP) return;
      const worldPos = s.sample.position.clone().applyEuler(parentRot);
      const facing = worldPos.normalize().dot(lightDir);
      const isNight = facing < 0.05 && i < houseCount;
      const sc = isNight
        ? new THREE.Vector3(s.scale * 1.1, s.scale * 1.1, s.scale * 1.1)
        : new THREE.Vector3(0, 0, 0);
      writeAlignedMatrix(
        lightsRef.current,
        null,
        i,
        s.sample,
        sc,
        s.scale * 0.85,
        s.yaw,
        isNight,
      );
    });

    // mark needsUpdate
    [
      houseBodyRef, houseBodyOutlineRef, houseRoofRef, houseRoofOutlineRef,
      broadleafRef, broadleafOutlineRef, pineRef, pineOutlineRef,
      trunkRef, rockRef, rockOutlineRef, lightsRef,
    ].forEach((r) => {
      if (r.current) r.current.instanceMatrix.needsUpdate = true;
    });
  });

  const toonProps = { gradientMap: gradient };


  return (
    <group>
      {/* HOUSES */}
      <instancedMesh ref={houseBodyOutlineRef} args={[undefined, undefined, HOUSE_CAP]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={INK} side={THREE.BackSide} />
      </instancedMesh>
      <instancedMesh ref={houseBodyRef} args={[undefined, undefined, HOUSE_CAP]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshToonMaterial {...toonProps} />
      </instancedMesh>

      <instancedMesh ref={houseRoofOutlineRef} args={[undefined, undefined, HOUSE_CAP]} frustumCulled={false}>
        <coneGeometry args={[0.85, 1, 4]} />
        <meshBasicMaterial color={INK} side={THREE.BackSide} />
      </instancedMesh>
      <instancedMesh ref={houseRoofRef} args={[undefined, undefined, HOUSE_CAP]} frustumCulled={false}>
        <coneGeometry args={[0.85, 1, 4]} />
        <meshToonMaterial {...toonProps} />
      </instancedMesh>

      {/* TREES */}
      <instancedMesh ref={trunkRef} args={[undefined, undefined, TREE_CAP]} frustumCulled={false}>
        <cylinderGeometry args={[0.5, 0.5, 1, 5]} />
        <meshToonMaterial {...toonProps} color="#5a3a22" />
      </instancedMesh>

      <instancedMesh ref={broadleafOutlineRef} args={[undefined, undefined, TREE_CAP]} frustumCulled={false}>
        <icosahedronGeometry args={[0.7, 0]} />
        <meshBasicMaterial color={INK} side={THREE.BackSide} />
      </instancedMesh>
      <instancedMesh ref={broadleafRef} args={[undefined, undefined, TREE_CAP]} frustumCulled={false}>
        <icosahedronGeometry args={[0.7, 0]} />
        <meshToonMaterial {...toonProps} color="#4f8a44" />
      </instancedMesh>

      <instancedMesh ref={pineOutlineRef} args={[undefined, undefined, TREE_CAP]} frustumCulled={false}>
        <coneGeometry args={[0.6, 1.4, 6]} />
        <meshBasicMaterial color={INK} side={THREE.BackSide} />
      </instancedMesh>
      <instancedMesh ref={pineRef} args={[undefined, undefined, TREE_CAP]} frustumCulled={false}>
        <coneGeometry args={[0.6, 1.4, 6]} />
        <meshToonMaterial {...toonProps} color="#2f6638" />
      </instancedMesh>

      {/* ROCKS */}
      <instancedMesh ref={rockOutlineRef} args={[undefined, undefined, ROCK_CAP]} frustumCulled={false}>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshBasicMaterial color={INK} side={THREE.BackSide} />
      </instancedMesh>
      <instancedMesh ref={rockRef} args={[undefined, undefined, ROCK_CAP]} frustumCulled={false}>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshToonMaterial {...toonProps} color="#8d8e8a" />
      </instancedMesh>

      {/* NIGHT LIGHTS — additive emissive blobs that glow on the dark side */}
      <instancedMesh ref={lightsRef} args={[undefined, undefined, LIGHT_CAP]} frustumCulled={false}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial
          color="#ffd084"
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
