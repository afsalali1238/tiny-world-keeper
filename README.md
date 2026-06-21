# The Terrarium

A quiet god-game diorama built for the browser. You are a **Keeper** — a silent watcher above a small living world. There is no score, no enemy, and no ending. Watch it turn, tend it gently, and see what stories the people inside invent about you.

> “You are a Keeper. In your hands is a small living world. There is no score, no enemy, no ending. Watch it. Tend it. The people inside will never know you, but they will be shaped by what you do.”

---

## What this is

**The Terrarium** is a slow, ambient world-tending toy. A tiny planet floats in soft light. Time passes quickly down there — days blink by, seasons roll, and civilisations grow between your glances. Your only power is a handful of gentle gestures: rain, sun, wind, seed.

It was built as a **single-session meditation on scale**: the player is vast and patient; the world is small and forgetful. The game remembers how you treat it, but it never judges.

---

## How to play

### Controls

| Action | How |
|--------|-----|
| Rotate the world | Drag / swipe on the planet |
| Pick a tool | Tap one of the four buttons in the bottom dock |
| Use the tool | Tap the land while a tool is selected |
| Change time speed | Use the ½× / 1× / 4× dial on the right |
| Re-watch the guide | Tap the **?** in the top-right corner |
| Toggle voice | Tap the speaker icon in the top-right corner |

### The four gestures

- **Rain** — adds water, sets weather to rain, nudges life forward.
- **Sun** — adds warmth, clears storms, nudges life forward.
- **Wind** — clears the sky, moves weather, a small breath across the world.
- **Seed** — the biggest life boost. Plants a small green thing.

### Combinations (the small grammar)

Try two tools in a row. Some pairs do something special:

| Combo | How | Effect |
|-------|-----|--------|
| **Steam** | Rain on a warm world (warmth > 0.55) | Mist rises; weather becomes aurora |
| **Bloom** | Seed when wet and warm (water > 0.45, warmth > 0.4) | Extra life burst |
| **Drought** | Three Suns within ~12 seconds | Life drops, water drains |
| **Exodus** | Wind within 5 seconds after Seed | A migration story is born |

---

## The world loop

The planet runs on a tick loop. Every tick:

- **Life** slowly grows on its own.
- **Warmth** and **water** decay toward neutrality unless you tend them.
- The world passes through **eras** based on total ticks:
  1. The Age of First Light
  2. The Age of Stones
  3. The Age of Myth
  4. The Age of Hearths
  5. The Age of Sails
  6. The Age of Towers
  7. The Long Age

As **life** rises, the planet becomes visibly more populated:

- `life < 0.05` — a quiet seed
- `life < 0.20` — a stirring world
- `life < 0.45` — a small civilization
- `life < 0.70` — a thriving world
- `life < 0.90` — a humming world
- `life ≥ 0.90` — a world of many lights

### Weather

Weather is a soft state: **clear**, **rain**, **storm**, or **aurora**. It drifts back to clear over time. Weather affects the planet’s colour, the clouds, and the narrator’s observations.

### Day / night

A single directional light orbits the world. On the night side, settlements glow with warm window lights. On the day side, the toon-shaded land reads bright and flat.

---

## The narrator

At the bottom of the screen a calm, italic line appears from time to time. The narrator is not a character inside the world — she is the voice of the observation itself, reading the planet to you.

She speaks on:

- tool use
- era changes
- life milestones
- discovered combos
- idle moments (every ~30–40 seconds)
- rare **uncanny** lines after you have visited several times
- **echo** lines that remember prior Keepers by name
- the **pivot** — a one-time line after ~25 minutes of play
- the **whisper** — very rare lines that break the fourth wall

If you turn on the speaker icon, her lines are spoken aloud by a generated voice through the Lovable AI Gateway (voice: `ash`, style: calm British nature-documentary).

---

## Choices

From time to time a card rises from the bottom with a question. The people below are arguing, praying, or deciding something. You can answer, or choose the ghost option and let them sort it out themselves.

Each choice nudges the world’s **traits**:

- **faith** — do they believe something watches over them?
- **curiosity** — do they ask dangerous questions?
- **fear** — do they feel small before the sky?
- **harmony** — do they find ways to agree?

Traits unlock new myths and new curiosities. There are no wrong answers.

---

## Myths

Every choice and some special moments create a **myth** — a short prose fragment that appears on the right side of the screen. Myths are the world’s memory of you. Recent myths fade; older ones are kept forever in the world state.

Examples:

- *“They say the Warm One leaned close and the sea remembered how to move.”*
- *“The rain came on the day they asked, and they sang of a kindness that listens.”*
- *“The Warm One did not answer. The people learned to mend what they had broken, and called the silence a teaching.”*

---

## Curiosities

The small dot in the top-right opens the **Curiosities** panel: a list of soft, hidden objectives. They are not achievements in the usual sense — there is no score, no popup fanfare, just a quiet note that you noticed something.

Some early Curiosities:

- Send the first rain
- Plant a green thing
- Use every gesture
- Witness the second age
- Watch a civilisation arrive
- Make steam
- Coax a bloom
- Let a generation pass untouched
- Come back to them (visit a second session)

Tier-2 Curiosities only reveal once the first tier is complete, including longer watches, more ages, and darker edges like *“Drown a country and let it recover.”*

---

## The intro

On first launch the game plays a short written sequence:

1. **The gift** — “Every Keeper is given one.”
2. **Name the world** — you give the terrarium a name.
3. **Breathe warmth** — the ice begins to melt.
4. **Let it rain** — the first water falls.
5. **Plant the first spark** — life begins.
6. **Begin tending** — the full HUD appears.

After naming, a short cinematic explainer video auto-plays once (muted, looping). You can reopen it anytime via the **?** button.

---

## Visual style

The look is inspired by the chunky, graphic, cel-shaded **Messenger** aesthetic:

- Flat saturated **terrarium teal** background (`#5fb8b8`).
- Cel-shaded planet and props using `MeshToonMaterial` with a 3-step gradient map.
- Dark **inverted-hull outlines** around the planet, houses, trees, and rocks — cheap, crisp, no post-processing.
- Chunky illustrated props: houses with pitched roofs and chimneys, broadleaf and pine trees, scattered rocks.
- Hand-drawn SVG doodles drifting in the DOM overlay.
- Warm serif typography (Fraunces) against the cool background.

---

## Tech stack

- **Framework:** TanStack Start v1 (full-stack React 19, Vite 8)
- **3D:** React Three Fiber + Drei + Three.js
- **State:** Zustand with `persist` middleware (localStorage)
- **Styling:** Tailwind CSS v4 with custom theme tokens
- **Audio / TTS:** Lovable AI Gateway (`/api/narrator` server route, streaming PCM)
- **Noise:** `simplex-noise` for planet displacement
- **Fonts:** Fraunces (serif) + Inter (sans)

---

## Running locally

```bash
# Install dependencies
bun install

# Start the dev server
bun run dev

# Build for production
bun run build
```

The TTS narrator route requires a `LOVABLE_API_KEY` environment variable. If it is missing, the subtitle still appears but no voice plays.

---

## Project structure

```
src/
  components/
    scene/            # 3D planet, diorama, lights, weather, touch effects
    ui-overlay/       # HUD, intro, choices, myths, narrator, tool dock, etc.
  game/
    store.ts          # Zustand world state + tick logic
    eras.ts           # Era definitions
    choices.ts        # Choice card data
    combos.ts         # Combo detection
    curiosities.ts    # Soft objective list
    myths.ts          # Myth library
    narrator-lines.ts # Narrator line pool + picker
    planet-geometry.ts# Procedural planet mesh + surface sampling
    toon-gradient.ts  # Cel-shading gradient + palette tokens
    types.ts          # Shared TypeScript types
  routes/
    api/narrator.ts   # TTS server endpoint
    __root.tsx        # Root layout
    index.tsx         # Home page
  styles.css          # Tailwind theme + animations
```

---

## Design notes

- **No fail state.** The world cannot die. It can be pushed, neglected, flooded, or scorched, but it will keep turning.
- **No explicit tutorial after the intro.** Discovery is part of the mood.
- **Time moves faster than real life.** A whole age can pass while you make coffee.
- **The world remembers you across sessions.** It notices when you return after a long absence.
- **Small glitches are intentional.** Once every few minutes the rendered planet briefly scales wrong — a quiet reminder that even the image you are watching is a simulation.

---

## Credits

Built with Lovable. Voices generated through the Lovable AI Gateway. Planet, props, and UI handcrafted in React Three Fiber and Tailwind CSS.
