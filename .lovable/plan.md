# Terrarium — MVP Plan (Phase 1)

A cozy, low-poly 3D god-game in the browser. You hold a tiny planet, warm it to life, then tend it through small soft choices that the people turn into myths. This plan covers MVP only; Asha, audio, the 5th-session meta beat, and final polish are Phase 2.

## Locked decisions

- **Scope:** MVP only — living planet, Genesis intro, choice/myth loop, save.
- **Persistence:** `localStorage` (Zustand `persist` middleware). No backend.
- **Planet names:** mythic suggestions (Vael, Mireth, Oru, Aethel, Sirin, Thal) + "surprise me" generator.
- **Followed person:** name randomized per save (Phase 2 — but reserved in the data model now).
- **Art:** primitives only (icosphere planet, instanced boxes/cones/capsules for houses/trees/people). No GLBs.

## What we're building

```text
┌─────────────────────────────────────────────────────┐
│  era ribbon (italic serif, name only)               │
│  ◐ "a thriving world"                  🔊  ☰        │
│                                                     │
│                    ╱──────╲                         │
│                   │ PLANET │   ← orbit/drag,        │
│                    ╲──────╱      idle auto-rotate   │
│                                                     │
│                                          ┌────────┐ │
│                                          │ myths  │ │
│                                          │  feed  │ │
│                                          └────────┘ │
│         ┌─────── choice card ───────┐               │
│         │  prompt + 2-3 options     │   [☀][☔][☄] │
│         └───────────────────────────┘               │
└─────────────────────────────────────────────────────┘
```

## Build order (5 increments, each is shippable)

### 1. Cozy 3D planet (foundation)
- Full-screen R3F canvas, lavender→peach gradient background.
- Low-poly icosphere displaced by simplex noise → continents.
- Per-vertex colors by elevation/latitude: teal ocean, sage→olive land, off-white snow caps.
- Soft key light + ambient + `ContactShadows` underneath (held-on-a-shelf feel).
- `OrbitControls` with damping, zoom limits, gentle idle auto-rotate.
- Thin atmosphere rim glow, slow "breathing" scale pulse, drifting cloud layer.
- Day/night via slowly rotating key light; night side reveals subtle dark tone.

### 2. World state + tick loop (the simulation under the hood)
- Zustand store `useWorld` (single source of truth) with `persist` to localStorage.
- One `useFrame` tick driver advances `life`, `era`, weather timers.
- Visible state, not numeric:
  - `life` rising → spawn more instanced low-poly houses + trees on land
  - night side → warm window-lights fade in as `life` grows
  - `weather` state → cloud density / rain particles / clear sky
- Nothing numeric ever shown in UI.

### 3. Intro: Gift → Name → Genesis (the entire tutorial)
- **Beat 1 (Gift):** dimmed scene, cold grey sphere, one-line-at-a-time lore, single "Open the terrarium" button.
- **Beat 2 (Name):** text field + 3 mythic suggestions + "surprise me" (procedural generator). Saved to store.
- **Beat 3 (Genesis):** three sequential single-button steps, each with a clear visible result:
  1. *Breathe warmth* → snow retreats, atmosphere glow appears
  2. *Let it rain* → oceans fill with teal spread, clouds drift in
  3. *Plant the first spark* → green point spreads, first house/person appears
- Hand off to main view with era ribbon "The Age of First Light".

### 4. Main HUD (cozy, sparse, one-thing-at-a-time)
- Tailwind overlays with soft glassy cards, serif italics for flavor.
- Era ribbon (top-center, name only).
- Living-pulse indicator (top-left): pulsing dot + qualitative label ("a quiet seed", "a thriving world", "a restless world") derived from `life` + `traits`.
- Choice-card slot (bottom-center) — only when a card is active.
- Myth feed (right, max 3 visible, older cards fade).
- God-action tray (bottom-right, 3 icons for MVP: send weather, drop a sign, withhold).
- Sound toggle + menu (top-right) — toggle present but inert in MVP.
- **Invariant:** only one primary overlay at a time.

### 5. Choice + myth systems (the loop)
- `ChoiceCard` type with `trigger(w)`, options, effects on traits/world/flags, optional myth.
- Event scheduler picks one eligible card at a time when the player isn't mid-overlay; surfaces it with a soft rise animation.
- Selecting an option: animates a visible world reaction (weather flips, bloom spreads, comet streaks), dismisses the card, queues myth.
- **8–10 starter micro-choice cards** (stars/lie-or-truth, twins/blessing, mountain-naming, drought-village, two-prophets, etc.).
- **God-action tray** writes ad-hoc choices into the same pipeline.
- **Myth feed:** entries slide in with a warm "myth mote" particle rising from the planet.
- **Guaranteed creation myth:** hard-scheduled at era 3 — *"the Warm One leaned close and the sea remembered how to move…"* — fires for every player regardless of choices.

## Data model (locked for MVP, reserves Phase 2 hooks)

```ts
type Trait = 'faith' | 'curiosity' | 'fear' | 'harmony';

interface WorldState {
  planetName: string;
  seed: number;
  era: number;
  ageName: string;
  warmth: number;   // 0..1, internal only
  water: number;    // 0..1, internal only
  life: number;     // 0..1, internal only
  traits: Record<Trait, number>;
  weather: 'clear' | 'rain' | 'storm' | 'aurora' | null;
  flags: Record<string, boolean>;  // includes substrate hook for v2
  session: number;                 // increments per load (Phase 2 uses it)
  intro: 'gift' | 'name' | 'warm' | 'water' | 'life' | 'done';
}

interface Person {
  id: string;
  name?: string;          // randomized for the followed one in Phase 2
  lat: number; lon: number;
  born: number;
  isFollowed: boolean;
  story: string[];
}

interface ChoiceCard {
  id: string;
  prompt: string;
  sub?: string;
  options: {
    label: string;
    ghost?: boolean;
    effects: Partial<Record<Trait, number>>;
    world?: Partial<WorldState>;
    mythId?: string;
  }[];
  trigger: (w: WorldState) => boolean;
  once?: boolean;
}

interface MythEntry { id: string; tag: string; text: string; era: number; }
interface EraConfig { name: string; durationTicks: number; guaranteed?: string[]; }
```

## Phase 2 (deferred, not built this pass)

Asha follow mechanic + raycast pick + "they speak to you" event · 5th-session meta beat · Reflections screen (S4) · audio (lo-fi loop, chimes, civ murmur via howler) · bloom postprocessing · Supabase cross-device · GLB art swap · substrate Easter egg.

## Technical notes

- **Stack:** TanStack Start (already scaffolded) + React 19 + Tailwind v4. Add `three`, `@react-three/fiber`, `@react-three/drei`, `simplex-noise`, `zustand`.
- **Routing:** single route `src/routes/index.tsx` renders the canvas + overlays. Intro is a state machine inside the store, not a separate route (keeps the planet always mounted).
- **SSR:** R3F is client-only. Wrap the canvas in a client-only mount (dynamic import or `useEffect` mount flag) so SSR doesn't choke on `window`.
- **Perf budget:** `dpr={[1,2]}`, instanced meshes for all props, low-detail icosphere (detail 4–5), one canvas.
- **Save shape:** Zustand `persist` under key `terrarium:v1`. Migration field included for future bumps.
- **Design tokens:** add cozy palette to `src/styles.css` (lavender, peach, sage, teal, snow, warm amber). All Tailwind classes resolve through tokens — no hardcoded hex in components.
- **Typography:** install `@fontsource/fraunces` (serif italics for flavor) + `@fontsource/inter` (UI). Imported in root.

## Acceptance for this MVP

- [ ] Player understands what to do without reading anything outside the diegetic intro.
- [ ] No numbers or sliders visible anywhere.
- [ ] Planet is alive while idle (day/night, clouds, growth).
- [ ] Every choice produces a visible world change and queues a myth.
- [ ] Guaranteed creation myth fires by era 3 for every player.
- [ ] Save persists across reloads.
- [ ] Loads fast, smooth on a laptop, passes the "cup of warm tea" vibe check.
