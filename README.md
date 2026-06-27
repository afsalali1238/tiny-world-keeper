# The Terrarium (V3: Survival Management God-Game)

A gorgeous, tense god-game diorama built for the browser. You are a **Keeper** — a silent watcher above a small living world. Watch it turn, tend it carefully, manage your Faith economy, and protect your tiny citizens from their own industrial hubris and the encroaching corruption.

> “You are a Keeper. In your hands is a small living world. Tend it. Protect it. The people inside will never know you, but their survival depends entirely on your timing.”

---

## What this is

**The Terrarium** started as a slow, ambient world-tending toy, but has evolved into a fully-fledged survival management game. A tiny planet floats in soft light. Time passes quickly down there — days blink by, seasons roll, and civilisations grow between your glances. 

You must manage a finite resource called **Faith** to cast miracles, counteract the environmental damage of late-stage industrialization, and fight off physical manifestations of corruption.

---

## How to play

### Core Mechanics & Economy

- **Faith (Devotion):** You cannot cast miracles for free. Every tool requires Faith. Faith regenerates passively, and the *speed* of regeneration is directly tied to your population size (`life`). If your population drops, your ability to intervene drops with it.
- **Industrial Drain:** As your civilization advances into later eras (e.g., *The Age of Towers*), they begin to passively consume water and generate massive amounts of heat. You must constantly spend Faith to cool the planet and replenish water supplies, or your citizens will perish.

### Controls

| Action | How |
|--------|-----|
| **Rotate/Zoom** | Drag/swipe to rotate. Pinch/Scroll to zoom. |
| **Pick a tool** | Tap one of the buttons in the bottom dock |
| **Use the tool** | Tap the land while a tool is selected |
| **Change time speed** | Use the ½× / 1× / 4× dial on the right |
| **Toggle voice** | Tap the speaker icon to enable Text-to-Speech prophecies |

### The Miracles (Tools)

- **Rain** — adds water, sets weather to rain, cools the planet.
- **Sun** — adds warmth, clears storms.
- **Wind** — clears the sky, moves weather.
- **Seed** — plants life.
- **Lightning (Targeted)** — destroys Blight. You must click *directly* near the Blight node in 3D space to destroy it. If you miss, you waste Faith and drastically raise the planet's **Fear**.
- **Aegis** — A protective shield used to block impending natural disasters.

### Disasters & The Prophecy System

You will not be blindsided by disasters. The game features a **Prophecy System** that telegraphs impending doom. If a Heatwave or Flood is 60 ticks away, ominous text will appear on the screen. 
*If you have Voice enabled, the AI Narrator will verbally announce the disaster aloud.* You must time your **Aegis** shield perfectly to survive the impact.

---

## The World Loop

The planet runs on a tick loop. Every tick:

- **Life** grows (if the environment is balanced) or dies (if temperatures/water reach extremes).
- **Warmth** and **water** decay toward neutrality in early eras, but are aggressively manipulated by the population in later eras.
- The world passes through **eras** based on total ticks:
  1. The Age of First Light
  2. The Age of Stones
  3. The Age of Myth
  4. The Age of Hearths
  5. The Age of Sails
  6. The Age of Towers *(Industrial Drain begins)*
  7. The Long Age

### Diegetic Atmosphere (Prayers)

As the simulation runs, you will see tiny floating text bubbles rise from the surface of the planet. These are the prayers of your citizens. Their content changes dynamically based on the current world traits:
- If **Fear** is high: *"Save us..."*
- If **Curiosity** is high: *"What is beyond the glass?"*
- If **Harmony** is high: *"We are at peace."*

---

## Endings (Win/Loss States)

Unlike early versions of the game, Terrarium V3 features strict win and loss conditions.

- **Corruption (Game Over):** If you fail to destroy Blight nodes with Lightning, they will grow, drain your life force, and eventually consume the planet.
- **Transcendence (Win):** If you successfully manage the planet's environment through the industrial eras while maintaining high Harmony, your civilization will transcend.
- **Escape (Alternate Win):** If your civilization reaches the end of the simulation with high Fear and Curiosity, they will attempt to break out of the terrarium glass.

---

## The Narrator & TTS

At the bottom of the screen a calm, italic line appears from time to time. The narrator is the voice of observation itself. 

If you turn on the speaker icon, her lines and the **Disaster Prophecies** are spoken aloud by a generated TTS voice through the Lovable AI Gateway (voice: `ash`, style: calm British nature-documentary).

---

## Tech stack

- **Framework:** TanStack Start v1 (full-stack React 19, Vite 8)
- **3D:** React Three Fiber + Drei + Three.js
- **State:** Zustand with `persist` middleware (localStorage)
- **Styling:** Tailwind CSS v4 with custom theme tokens
- **Audio / TTS:** Lovable AI Gateway (`/api/narrator` server route, streaming PCM)
- **Math/Geometry:** Spherical trigonometry for precise 3D surface mapping.

---

## Running locally

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Build for production
npm run build
```

The TTS narrator route requires a `LOVABLE_API_KEY` environment variable. If it is missing, the subtitle still appears but no voice plays.

---

## Credits

Built with Lovable. Voices generated through the Lovable AI Gateway. Planet, props, and UI handcrafted in React Three Fiber and Tailwind CSS.
