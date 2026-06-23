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
    // Sample each kind independently so rocks always get land-anchored samples.
    // A shared pool can run short and leave InstancedMesh slots at the default
    // identity matrix (full-size dodecahedrons stuck at world origin / floating
    // off the planet silhouette).
    const houseSamples = samplePlanetSurface(geom, seed, HOUSE_CAP);
    const treeSamples = samplePlanetSurface(geom, seed + 7, TREE_CAP);
    const rockSamples = samplePlanetSurface(geom, seed + 13, ROCK_CAP);
    const r = rng(seed + 99);
    const mk = (sample: PlanetSample, kind: Slot["kind"]): Slot => ({
      sample,
      kind,
      scale: 0.02 + r() * 0.012,
      yaw: r() * Math.PI * 2,
      treeSpecies: r() > 0.5 ? 0 : 1,
      houseColor: new THREE.Color(HOUSE_PALETTE[Math.floor(r() * HOUSE_PALETTE.length)]),
      roofColor: new THREE.Color(ROOF_PALETTE[Math.floor(r() * ROOF_PALETTE.length)]),
    });
    return [
      ...houseSamples.map((s) => mk(s, "house")),
      ...treeSamples.map((s) => mk(s, "tree")),
      ...rockSamples.map((s) => mk(s, "rock")),
    ];
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

  useFrame((state) => {
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

    // rocks — small surface props, anchored to land like houses & trees.
    rocks.forEach((s, i) => {
      const visible = i < rockCount;
      // Roughly house-sized footprint, low-slung. dodecahedron geom radius is 0.5.
      const sc = new THREE.Vector3(s.scale * 1.6, s.scale * 1.0, s.scale * 1.6);
      writeAlignedMatrix(
        rockRef.current,
        rockOutlineRef.current,
        i,
        s.sample,
        sc,
        s.scale * 0.45,
        s.yaw,
        visible,
        1.12,
      );
    });
    // Zero any unused rock slots (e.g. if rocks.length < ROCK_CAP) so default
    // identity matrices don't render a unit-size dodecahedron at world origin.
    for (let i = rocks.length; i < ROCK_CAP; i++) {
      writeAlignedMatrix(
        rockRef.current,
        rockOutlineRef.current,
        i,
        { position: new THREE.Vector3(), normal: new THREE.Vector3(0, 1, 0), elevation: 0, latitude: 0, isLand: true },
        new THREE.Vector3(0, 0, 0),
        0,
        0,
        false,
      );
    }

    // night lights — one per house, only on night side. We render two layers:
    // a bright core and a soft additive halo, so each settlement reads as a
    // glowing dot at distance even on small screens.
    // Sun direction matches SunLight.tsx so the terminator lines up with actual lighting.
    const t = state.clock.elapsedTime;
    const sunSpeed = useWorld.getState().intro === "done" ? 0.09 : 0.02;
    const lightDir = new THREE.Vector3(
      Math.cos(t * sunSpeed) * 5,
      1.6,
      Math.sin(t * sunSpeed) * 5,
    ).normalize();
    const parentRot = (lightsRef.current?.parent?.parent?.rotation as THREE.Euler) ?? new THREE.Euler();
    // Subtle flicker so the lights feel lived-in.
    const flicker = 0.92 + Math.sin(t * 3.1) * 0.04 + Math.sin(t * 7.7) * 0.04;
    houses.forEach((s, i) => {
      if (i >= LIGHT_CAP) return;
      const worldPos = s.sample.position.clone().applyEuler(parentRot);
      const facing = worldPos.normalize().dot(lightDir);
      // smooth fade across the terminator instead of a hard cutoff
      const nightAmt = THREE.MathUtils.clamp((0.1 - facing) * 4, 0, 1);
      const visible = i < houseCount && nightAmt > 0.01;
      const coreScale = s.scale * 2.6 * nightAmt * flicker;
      const haloScale = s.scale * 6.5 * nightAmt;
      const sc = visible
        ? new THREE.Vector3(coreScale, coreScale, coreScale)
        : new THREE.Vector3(0, 0, 0);
      writeAlignedMatrix(
        lightsRef.current,
        null,
        i,
        s.sample,
        sc,
        s.scale * 0.85,
        s.yaw,
        visible,
      );
      // halo
      const haloSc = visible
        ? new THREE.Vector3(haloScale, haloScale, haloScale)
        : new THREE.Vector3(0, 0, 0);
      writeAlignedMatrix(
        lightHaloRef.current,
        null,
        i,
        s.sample,
        haloSc,
        s.scale * 0.85,
        s.yaw,
        visible,
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
