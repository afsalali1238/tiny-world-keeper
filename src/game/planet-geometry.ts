import { createNoise3D } from "simplex-noise";
import * as THREE from "three";

export interface PlanetSample {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  elevation: number;
  latitude: number;
  isLand: boolean;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildPlanetGeometry(seed: number, radius = 1) {
  const rng = mulberry32(seed);
  const noise = createNoise3D(rng);
  // detail 6 = chunky low-poly facets, Messenger-style
  let geom: THREE.BufferGeometry = new THREE.IcosahedronGeometry(radius, 6);
  // displace vertices with noise (indexed positions, before non-indexing)
  const pos = geom.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const seaLevel = 0.02;
  const elevations: number[] = new Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    let n = 0;
    let amp = 1;
    let freq = 1.4;
    for (let o = 0; o < 5; o++) {
      n += noise(v.x * freq, v.y * freq, v.z * freq) * amp;
      amp *= 0.5;
      freq *= 2.1;
    }
    n *= 0.45;
    elevations[i] = n;
    const surface = v.clone().multiplyScalar(radius * (1 + Math.max(n, seaLevel) * 0.06));
    pos.setXYZ(i, surface.x, surface.y, surface.z);
  }

  // convert to non-indexed so each face has its own verts + normals
  geom = geom.toNonIndexed();
  const nPos = geom.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(nPos.count * 3);

  const oceanDeep = new THREE.Color("#2e7d80");
  const oceanShallow = new THREE.Color("#54b0ad");
  const beach = new THREE.Color("#e0cf9a");
  const land = new THREE.Color("#7fbe6a");
  const landDark = new THREE.Color("#4d8a44");
  const snow = new THREE.Color("#f3efe6");

  // for each face (3 verts), compute one color from the face centroid and apply to all 3
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const center = new THREE.Vector3();
  for (let f = 0; f < nPos.count; f += 3) {
    a.fromBufferAttribute(nPos, f);
    b.fromBufferAttribute(nPos, f + 1);
    c.fromBufferAttribute(nPos, f + 2);
    center.copy(a).add(b).add(c).multiplyScalar(1 / 3);
    const dir = center.clone().normalize();
    const elev = center.length() / radius - 1;
    const isLand = elev > seaLevel * 0.06 * 0.5;
    const lat = Math.abs(dir.y);
    let col: THREE.Color;
    if (!isLand) {
      const depth = Math.min(1, (seaLevel - elev) * 4);
      col = oceanShallow.clone().lerp(oceanDeep, depth);
    } else {
      const h = Math.min(1, elev * 10);
      if (h < 0.06) col = beach.clone();
      else col = land.clone().lerp(landDark, h);
      if (lat > 0.78) col.lerp(snow, Math.min(1, (lat - 0.78) * 5));
    }
    for (let k = 0; k < 3; k++) {
      colors[(f + k) * 3] = col.r;
      colors[(f + k) * 3 + 1] = col.g;
      colors[(f + k) * 3 + 2] = col.b;
    }
  }

  geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geom.computeVertexNormals(); // now produces per-face flat normals
  return geom;
}


// sample N points on the planet for placing instances
export function samplePlanetSurface(
  geom: THREE.BufferGeometry,
  seed: number,
  count: number,
): PlanetSample[] {
  const rng = mulberry32(seed + 1);
  const pos = geom.attributes.position as THREE.BufferAttribute;
  const col = geom.attributes.color as THREE.BufferAttribute;
  const samples: PlanetSample[] = [];
  const v = new THREE.Vector3();
  const c = new THREE.Color();
  let attempts = 0;
  while (samples.length < count && attempts < count * 20) {
    attempts++;
    const i = Math.floor(rng() * pos.count);
    v.fromBufferAttribute(pos, i);
    c.fromBufferAttribute(col, i);
    // land detection: green-ish (g > b and g > 0.4)
    const isLand = c.g > c.b && c.g > 0.45;
    if (!isLand) continue;
    const lat = Math.abs(v.y / v.length());
    if (lat > 0.85) continue;
    const normal = v.clone().normalize();
    samples.push({ position: v.clone(), normal, elevation: v.length(), latitude: lat, isLand });
  }
  return samples;
}
