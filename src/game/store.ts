import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChoiceOption, MythEntry, ToolKind, TouchEffect, WorldState } from "./types";
import { ageNameForEra, ERAS } from "./eras";
import { CHOICE_CARDS } from "./choices";
import { MYTH_LIBRARY } from "./myths";

export interface NarrationCue {
  id: string;
  text: string;
  bornAt: number;
}

interface Actions {
  setIntro: (step: WorldState["intro"]) => void;
  setPlanetName: (name: string) => void;
  breatheWarmth: () => void;
  letItRain: () => void;
  plantSpark: () => void;
  tick: (dt: number) => void;
  surfaceChoiceIfReady: () => void;
  resolveChoice: (option: ChoiceOption) => void;
  godAction: (kind: "rain" | "sign" | "withhold") => void;
  setTool: (tool: ToolKind | null) => void;
  applyToolAt: (pos: [number, number, number]) => void;
  setAudio: (on: boolean) => void;
  narrate: (cue: NarrationCue) => void;
  clearNarration: () => void;
  markFifthFired: () => void;
  reset: () => void;
}

const initialWorld: WorldState = {
  planetName: "",
  seed: Math.floor(Math.random() * 100000),
  era: 0,
  ageName: ERAS[0].name,
  warmth: 0,
  water: 0,
  life: 0,
  traits: { faith: 0, curiosity: 0, fear: 0, harmony: 0 },
  weather: null,
  flags: {},
  session: 0,
  intro: "gift",
  ticks: 0,
  myths: [],
  activeChoiceId: null,
  resolvedChoiceIds: [],
  firedMythIds: [],
  selectedTool: null,
  effects: [],
  audioOn: false,
  currentNarration: null,
  recentNarrationIds: [],
  lastToolEvent: null,
  fifthFired: false,
};

const clamp = (n: number) => Math.max(0, Math.min(1, n));

let tickAccumulator = 0;
let choiceCooldown = 30; // start gently: no choices for the first ~30s
let effectId = 1;

function addMyth(state: WorldState, mythId: string): Partial<WorldState> {
  if (state.firedMythIds.includes(mythId)) return {};
  const template = MYTH_LIBRARY[mythId];
  if (!template) return {};
  const entry: MythEntry = {
    ...template,
    era: state.era,
    createdAt: Date.now(),
  };
  return {
    myths: [entry, ...state.myths].slice(0, 30),
    firedMythIds: [...state.firedMythIds, mythId],
  };
}

export const useWorld = create<WorldState & Actions>()(
  persist(
    (set, get) => ({
      ...initialWorld,

      setIntro: (intro) => set({ intro }),
      setPlanetName: (planetName) => set({ planetName, intro: "warm" }),

      breatheWarmth: () => set({ warmth: 0.7, intro: "water" }),
      letItRain: () => set({ water: 0.8, weather: "rain", intro: "life" }),
      plantSpark: () =>
        set({ life: 0.12, weather: "clear", intro: "done", ageName: ERAS[0].name }),

      tick: (dt) => {
        const s = get();
        if (s.intro !== "done") return;

        tickAccumulator += dt;
        choiceCooldown = Math.max(0, choiceCooldown - dt);
        if (tickAccumulator < 0.25) return;
        tickAccumulator = 0;

        const ticks = s.ticks + 1;
        const life = clamp(s.life + 0.0025);

        // era advancement
        let era = s.era;
        let acc = 0;
        for (let i = 0; i < ERAS.length; i++) {
          acc += ERAS[i].durationTicks;
          if (ticks < acc) {
            era = i;
            break;
          }
          era = i;
        }
        const ageName = ageNameForEra(era);

        // weather decay
        let weather = s.weather;
        if (weather && weather !== "clear" && Math.random() < 0.01) weather = "clear";

        let patch: Partial<WorldState> = { ticks, life, era, ageName, weather };

        // guaranteed creation myth on entering era 3 (index 2)
        if (era >= 2 && !s.firedMythIds.includes("creation")) {
          patch = { ...patch, ...addMyth({ ...s, ...patch } as WorldState, "creation") };
        }

        // age out touch effects (~2s lifespan)
        const now = Date.now();
        const liveEffects = s.effects.filter((e) => now - e.bornAt < 2000);
        if (liveEffects.length !== s.effects.length) patch.effects = liveEffects;

        set(patch);
        get().surfaceChoiceIfReady();
      },

      surfaceChoiceIfReady: () => {
        const s = get();
        if (s.activeChoiceId || s.intro !== "done" || choiceCooldown > 0) return;
        const eligible = CHOICE_CARDS.filter(
          (c) => c.trigger(s) && !(c.once && s.resolvedChoiceIds.includes(c.id)),
        );
        if (!eligible.length) return;
        if (Math.random() > 0.08) return; // rare event, not a steady drumbeat
        const pick = eligible[Math.floor(Math.random() * eligible.length)];
        set({ activeChoiceId: pick.id });
      },

      resolveChoice: (option) => {
        const s = get();
        const id = s.activeChoiceId;
        if (!id) return;
        const traits = { ...s.traits };
        for (const [k, v] of Object.entries(option.effects ?? {})) {
          const key = k as keyof typeof traits;
          traits[key] = clamp(traits[key] + (v ?? 0));
        }
        let patch: Partial<WorldState> = {
          traits,
          activeChoiceId: null,
          resolvedChoiceIds: [...s.resolvedChoiceIds, id],
          ...(option.world ?? {}),
        };
        if (option.world?.life !== undefined) {
          patch.life = clamp(s.life + option.world.life);
        }
        if (option.world?.warmth !== undefined) {
          patch.warmth = clamp(s.warmth + option.world.warmth);
        }
        if (option.world?.water !== undefined) {
          patch.water = clamp(s.water + option.world.water);
        }
        if (option.setFlag) {
          patch.flags = { ...s.flags, [option.setFlag]: true };
        }
        if (option.mythId) {
          patch = { ...patch, ...addMyth({ ...s, ...patch } as WorldState, option.mythId) };
        }
        choiceCooldown = 8;
        set(patch);
      },

      godAction: (kind) => {
        const s = get();
        if (kind === "rain") {
          set({ weather: "rain" });
        } else if (kind === "sign") {
          set({ weather: "aurora" });
          set(addMyth(s, "cometSign"));
        } else if (kind === "withhold") {
          set(addMyth(s, "withheld"));
        }
      },

      setTool: (selectedTool) => set({ selectedTool }),

      applyToolAt: (pos) => {
        const s = get();
        const tool = s.selectedTool;
        if (!tool) return;
        const effect: TouchEffect = { id: effectId++, kind: tool, pos, bornAt: Date.now() };
        const effects = [...s.effects, effect].slice(-12);
        const patch: Partial<WorldState> = {
          effects,
          lastToolEvent: { kind: tool, ts: Date.now() },
        };
        if (tool === "rain") {
          patch.water = clamp(s.water + 0.04);
          patch.weather = "rain";
        } else if (tool === "sun") {
          patch.warmth = clamp(s.warmth + 0.04);
          patch.weather = "clear";
        } else if (tool === "wind") {
          patch.weather = "clear";
        } else if (tool === "seed") {
          patch.life = clamp(s.life + 0.015);
        }
        set(patch);
      },

      setAudio: (audioOn) => set({ audioOn }),

      narrate: (cue) => {
        const s = get();
        set({
          currentNarration: cue,
          recentNarrationIds: [cue.id, ...s.recentNarrationIds].slice(0, 6),
        });
      },

      clearNarration: () => set({ currentNarration: null }),

      markFifthFired: () => set({ fifthFired: true }),

      reset: () => set({ ...initialWorld, seed: Math.floor(Math.random() * 100000) }),
    }),
    {
      name: "terrarium:v1",
      version: 1,
      partialize: (s) => ({
        planetName: s.planetName,
        seed: s.seed,
        era: s.era,
        ageName: s.ageName,
        warmth: s.warmth,
        water: s.water,
        life: s.life,
        traits: s.traits,
        weather: s.weather,
        flags: s.flags,
        session: s.session,
        intro: s.intro,
        ticks: s.ticks,
        myths: s.myths,
        resolvedChoiceIds: s.resolvedChoiceIds,
        firedMythIds: s.firedMythIds,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.session = (state.session ?? 0) + 1;
          state.activeChoiceId = null;
        }
      },
    },
  ),
);

export function lifeLabel(life: number): string {
  if (life < 0.05) return "a quiet seed";
  if (life < 0.2) return "a stirring world";
  if (life < 0.45) return "a small civilization";
  if (life < 0.7) return "a thriving world";
  if (life < 0.9) return "a humming world";
  return "a world of many lights";
}
