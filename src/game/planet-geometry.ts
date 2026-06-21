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
  const geom = new THREE.IcosahedronGeometry(radius, 12);
  const pos = geom.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);

  const seaLevel = 0.02;
  const v = new THREE.Vector3();

  const oceanDeep = new THREE.Color("#2a6e7a");
  const oceanShallow = new THREE.Color("#4ca6a8");
  const beach = new THREE.Color("#d9c89a");
  const land = new THREE.Color("#7fa971");
  const landDark = new THREE.Color("#4f7a4a");
  const snow = new THREE.Color("#f3efe6");

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

    const elev = n;
    const isLand = elev > seaLevel;
    const surface = v.clone().multiplyScalar(radius * (1 + Math.max(elev, seaLevel) * 0.06));
    pos.setXYZ(i, surface.x, surface.y, surface.z);

    const lat = Math.abs(v.y);
    let c: THREE.Color;
    if (!isLand) {
      const depth = Math.min(1, (seaLevel - elev) * 8);
      c = oceanShallow.clone().lerp(oceanDeep, depth);
    } else {
      const h = (elev - seaLevel) / 0.4;
      if (h < 0.05) c = beach.clone();
      else c = land.clone().lerp(landDark, Math.min(1, h));
      if (lat > 0.78) c.lerp(snow, Math.min(1, (lat - 0.78) * 5));
    }
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geom.computeVertexNormals();
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
