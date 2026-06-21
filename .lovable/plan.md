# Visual overhaul — Messenger diorama look

Goal: shift Terrarium from "soft pastel low-poly" to the chunky, graphic, cel-shaded **Messenger** look — flat saturated background, dense diorama of stylized props on the planet, toon outlines, floating doodle decorations.

No new gameplay. Same loop, same store. Pure visual + scene-density pass.

## What changes

### 1. Background — flat saturated color
- Remove the lavender→peach radial gradients from `body`.
- Replace with a single solid **terrarium teal** (`#5fb8b8`-ish in oklch), matching Messenger's signature backdrop.
- The R3F canvas gets a matching `scene.background` color so there's no seam.
- Body-level `body` styles trimmed to just the solid color; the gradient classes stay available as utilities but aren't used.

### 2. Toon shading + outlines on the planet and props
- Swap `meshStandardMaterial` → `MeshToonMaterial` with a 3-step gradient map for crisp cel-shading.
- Add an **inverted-hull outline** to the planet, houses, and trees (a slightly-scaled back-faced mesh in dark ink color). This is cheap, works without postprocessing, and gives the Messenger silhouette.
- Reduce light count to one strong key + low ambient so the toon banding reads cleanly.

### 3. Chunky illustrated props (the big visual delta)
Replace today's boxes-and-cones with multi-shape "kits" so each prop reads as a tiny building / tree:
- **House kit**: a colored box body + a darker pitched-roof prism + a tiny chimney. Random palette per instance from a warm Messenger set (terracotta, mustard, cream, dusty blue, brick).
- **Tree kit**: stacked spheres or a low-poly blob on a thin trunk; two species (round broadleaf in deep green, conical pine in forest green).
- **Rock kit**: small grey low-poly chunks scattered as filler.
- Density goes way up: cap ~180 trees, ~100 houses, ~40 rocks. As `life` grows, slots fill from 0 → cap (same mechanic, just chunkier and more numerous).
- Each prop builds as a small `<group>` exported once; we batch into instanced meshes per sub-shape (house body / roof / tree foliage / tree trunk) so we keep the perf budget.

### 4. Planet surface
- Keep the noise-displaced icosphere, but bump base saturation: oceans toward Messenger's bright teal (`#6cc1bd`), land toward vivid grass green (`#7fbe6a`), beaches toward warm sand.
- Slightly larger planet on screen (camera pulled in from z=3.4 → z=3.0) so it fills more frame like Messenger.
- Atmosphere rim dialed back (the flat-bg look reads cleaner without a haze).

### 5. Floating doodle decorations
- Add 12–18 hand-drawn-feeling SVG doodles (squiggles, tiny clouds, asterisks, little birds) randomly placed in the **DOM overlay layer** behind the HUD, very low opacity, slow drift via CSS transform animations.
- Pure CSS/SVG, no 3D cost. They live in a new `BackgroundDoodles` component.

### 6. HUD palette retune
- Cards: keep the soft glassy card style but warm the surface slightly to read against the teal.
- Era ribbon + living pulse: text color shifts to a deep teal/ink for contrast on the flat background.
- Choice card buttons: cream/ink pairing rather than dark slate.

### 7. Day/night, weather, clouds
- Day/night still rolls; on night side the toon shading darkens (gradient map handles it automatically), warm window-lights pop more.
- Clouds become small chunky white blobs (same instancing, smaller scale, fewer = ~25) with the toon outline treatment.

## Files touched

```text
src/styles.css                              — flat teal bg, palette retune
src/components/scene/Planet.tsx             — toon material + outline, denser sampling
src/components/scene/Clouds.tsx             — chunky toon-outlined puffs
src/components/scene/SunLight.tsx           — single key light, lower ambient
src/components/scene/TerrariumScene.tsx     — scene.background = teal, camera 3.0
src/components/scene/props/House.tsx        — NEW: instanced body+roof+chimney kit
src/components/scene/props/Tree.tsx         — NEW: instanced foliage+trunk kit (2 species)
src/components/scene/props/Rocks.tsx        — NEW: instanced rock chunks
src/components/scene/Outline.tsx            — NEW: helper for inverted-hull outline meshes
src/components/ui-overlay/BackgroundDoodles.tsx  — NEW: SVG doodles overlay
src/components/ui-overlay/HUD.tsx           — palette tweak for flat-bg contrast
src/components/TerrariumApp.tsx             — mount BackgroundDoodles behind canvas
```

## Technical notes

- **Toon gradient map**: 3-step `DataTexture` with `NearestFilter` — created once, shared across all toon materials. Lives in `src/game/toon-gradient.ts`.
- **Outline pattern**: per prop, render the same geometry a second time scaled ~1.04 with a `MeshBasicMaterial({ color: ink, side: BackSide })`. Free, no postprocessing pipeline needed, plays nicely with instancing.
- **Prop instancing**: each sub-shape stays its own `InstancedMesh` (house bodies, roofs, chimneys, broadleaf foliage, pine foliage, trunks, rocks). The Planet component owns the surface sampling and dispatches matrices to each via refs in a single `useFrame` pass. Keeps the matrix updates O(n) and avoids per-prop React reconciliation.
- **Sampling**: re-use existing `samplePlanetSurface`. Bump count to ~400, then partition deterministically into house / tree / rock slots so the layout is stable across reloads (driven by seed).
- **Perf budget**: still one canvas, `dpr={[1,2]}`. Outline meshes double draw calls per prop *type* but each is still a single instanced draw, so we end up at ~16 draw calls for the diorama — fine.
- No new packages required. Everything ships with `three`/`drei` already installed.

## Acceptance

- [ ] Flat saturated teal background, no gradient seams.
- [ ] Planet reads as cel-shaded with a visible dark outline silhouette.
- [ ] Trees and houses look like little objects (body + roof, trunk + foliage), not primitives.
- [ ] Land surface visibly populates with dozens of props as `life` grows.
- [ ] A handful of subtle hand-drawn doodles drift in the background behind the planet.
- [ ] HUD remains readable against the new flat background.
- [ ] No regressions to intro, choice, or myth systems.
