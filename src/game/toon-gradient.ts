import * as THREE from "three";

let cached: THREE.DataTexture | null = null;

export function getToonGradient(): THREE.DataTexture {
  if (cached) return cached;
  const steps = 3;
  const data = new Uint8Array(steps);
  for (let i = 0; i < steps; i++) {
    data[i] = Math.floor(((i + 1) / steps) * 255);
  }
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  cached = tex;
  return tex;
}

export const INK = "#1a2a2a";
export const BACKGROUND_TEAL = "#5fb8b8";

// Warm Messenger-ish house palette
export const HOUSE_PALETTE = [
  "#e8a062", // terracotta
  "#e8c763", // mustard
  "#f0e2c4", // cream
  "#9bbcc4", // dusty blue
  "#c66b4a", // brick
  "#d99270", // peach
  "#b88e5a", // sand
];

export const ROOF_PALETTE = [
  "#7a3e2a",
  "#6e4a2a",
  "#8a4936",
  "#3a4a52",
  "#5a3024",
];
