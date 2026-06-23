import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChoiceOption, MythEntry, Speed, ToolKind, TouchEffect, WorldState } from "./types";
import { ageNameForEra, ERAS } from "./eras";
import { CHOICE_CARDS } from "./choices";
import { MYTH_LIBRARY } from "./myths";
import { CURIOSITIES } from "./curiosities";
import { detectCombo } from "./combos";
import { rememberKeeper } from "./keepers";
import { randomMythicName } from "./names";

// Dev/test hook: `?fresh=1` wipes the persisted save BEFORE zustand hydrates
// so automated checks (and humans replaying genesis) always land at the gift
// beat. The query param is stripped from the URL so a refresh doesn't re-wipe.
if (typeof window !== "undefined") {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("fresh") === "1") {
      window.localStorage.removeItem("terrarium:v1");
      params.delete("fresh");
      const qs = params.toString();
      const url = window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash;
      window.history.replaceState(null, "", url);
    }
  } catch {
    // ignore — storage may be blocked in some embeds
  }
}


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
  pourPeople: () => void;
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
  setSpeed: (s: Speed) => void;
  ackCuriosityToast: () => void;
  markPivotFired: () => void;
  clearGlassMoment: () => void;
  clearRecentCombo: () => void;
  setComboFirstSeen: () => void;

  clearOfflineGap: () => void;
  touchLastSeen: () => void;
  followPerson: (pos: [number, number, number]) => void;
  unfollowPerson: () => void;
  answerFollowedAddress: (answer: "star" | "quiet") => void;
  reset: () => void;
}

const createInitialWorld = (): WorldState => ({
  planetName: "",
  seed: Math.floor(Math.random() * 100000),
  era: 0,
  ageName: "",
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
  speed: 1,
  unlockedCuriosityIds: [],
  lastUnlockedCuriosity: null,
  playMs: 0,
  pivotFired: false,
  glassMomentAt: null,
  lastSeenAt: null,
  offlineGapMs: null,
  recentCombo: null,
  followed: null,
});

const initialWorld = createInitialWorld();

const VALID_INTROS = new Set<WorldState["intro"]>(["gift", "warm", "spray", "seed", "name", "done"]);

function hasName(name: string | undefined) {
  return !!name && name.trim() !== "";
}

function shouldForceColdGenesis(state: Partial<WorldState>) {
  const unnamed = !hasName(state.planetName);
  const noProgress =
    (state.ticks ?? 0) === 0 &&
    (state.era ?? 0) === 0 &&
    (state.life ?? 0) === 0 &&
    (state.warmth ?? 0) === 0 &&
    (state.water ?? 0) === 0 &&
    (!state.myths || state.myths.length === 0) &&
    (!state.firedMythIds || state.firedMythIds.length === 0);

  // The old/new-game bug produced an unnamed world that was already in a late
  // era with the creation myth written. Treat every unnamed "advanced" save as
  // a corrupt fresh start so first-time players always live Genesis.
  const unnamedAdvancedSeed =
    unnamed &&
    ((state.intro === "done") ||
      (state.ticks ?? 0) > 0 ||
      (state.era ?? 0) > 0 ||
      (state.life ?? 0) > 0 ||
      (state.warmth ?? 0) > 0 ||
      (state.water ?? 0) > 0 ||
      !!state.weather ||
      !!state.flags && Object.keys(state.flags).length > 0 ||
      !!state.myths && state.myths.length > 0 ||
      !!state.firedMythIds && state.firedMythIds.length > 0);

  return unnamed && (noProgress || unnamedAdvancedSeed);
}

function coldGenesisPatch(seed = Math.floor(Math.random() * 100000)): Partial<WorldState> {
  return {
    ...createInitialWorld(),
    seed,
  };
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));

let tickAccumulator = 0;
let choiceCooldown = 30;
let effectId = 1;
let comboMemory = { lastTool: null as ToolKind | null, lastToolTs: 0, sunStreak: { count: 0, lastTs: 0 } };

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

function runCuriosityChecks(state: WorldState): Partial<WorldState> | null {
  const unlocked = new Set(state.unlockedCuriosityIds);
  let newly: string | null = null;
  for (const c of CURIOSITIES) {
    if (unlocked.has(c.id)) continue;
    if (c.check(state)) {
      unlocked.add(c.id);
      newly = c.id;
      break; // one per tick keeps toasts from stacking
    }
  }
  if (!newly) return null;
  return {
    unlockedCuriosityIds: Array.from(unlocked),
    lastUnlockedCuriosity: { id: newly, ts: Date.now() },
  };
}

export const useWorld = create<WorldState & Actions>()(
  persist(
    (set, get) => ({
      ...initialWorld,

      setIntro: (intro) => set({ intro }),
      setPlanetName: (planetName) => {
        rememberKeeper(planetName);
        const s = get();
        // Naming is the LAST genesis beat. Open the world for real:
        // pour the first people, set the opening age, fire the creation myth.
        let patch: Partial<WorldState> = {
          planetName,
          intro: "done",
          selectedTool: null,
          life: Math.max(s.life, 0.45),
          weather: "aurora",
          ageName: ERAS[0].name,
          era: 0,
          flags: { ...s.flags, "intro:poured": true },
        };
        patch = { ...patch, ...addMyth({ ...s, ...patch } as WorldState, "creation") };
        set(patch);
      },

      // Legacy intro actions (kept for backward compat; new flow uses tool taps).
      breatheWarmth: () => set({ warmth: 0.7 }),
      letItRain: () => set({ water: 0.8, weather: "rain" }),
      plantSpark: () => set({ life: 0.12, weather: "clear", ageName: ERAS[0].name }),

      pourPeople: () => {
        const s = get();
        // Legacy: previously a separate jar step. Kept so old saves don't crash.
        set({
          life: Math.max(s.life, 0.45),
          weather: "aurora",
          intro: "done",
          ageName: ERAS[0].name,
          flags: { ...s.flags, "intro:poured": true },
        });
      },

      tick: (dt) => {
        const s = get();
        if (s.intro !== "done") return;

        // dt is already scaled by speed in the TickDriver, but we also track
        // real playtime for the pivot moment.
        const realDt = dt; // caller scales; pivot uses scaled time too (close enough)

        tickAccumulator += realDt;
        choiceCooldown = Math.max(0, choiceCooldown - realDt);
        if (tickAccumulator < 0.25) {
          // still bump playMs lightly for sub-tick accumulation
          return;
        }
        const accumulated = tickAccumulator;
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

        let weather = s.weather;
        if (weather && weather !== "clear" && Math.random() < 0.01) weather = "clear";

        let patch: Partial<WorldState> = {
          ticks,
          life,
          era,
          ageName,
          weather,
          playMs: s.playMs + accumulated * 1000,
        };

        // The Glass: rare camera-pullback on era change.
        if (era !== s.era && Math.random() < 0.18) {
          patch.glassMomentAt = Date.now();
          patch.flags = { ...s.flags, "glass:seen": true };
        }

        if (era >= 2 && !s.firedMythIds.includes("creation")) {
          patch = { ...patch, ...addMyth({ ...s, ...patch } as WorldState, "creation") };
        }

        // Rare direct address from the followed villager. Once, after era 2.
        if (
          s.followed &&
          !s.followed.pendingAddress &&
          !s.flags["followed:addressed"] &&
          s.era >= 2 &&
          Math.random() < 0.004
        ) {
          patch.followed = { ...s.followed, pendingAddress: true };
        }

        const now = Date.now();
        const liveEffects = s.effects.filter((e) => now - e.bornAt < 2000);
        if (liveEffects.length !== s.effects.length) patch.effects = liveEffects;

        set(patch);

        // Curiosities check.
        const curPatch = runCuriosityChecks({ ...get() });
        if (curPatch) set(curPatch);

        get().surfaceChoiceIfReady();
      },

      surfaceChoiceIfReady: () => {
        const s = get();
        if (s.activeChoiceId || s.intro !== "done" || choiceCooldown > 0) return;
        const eligible = CHOICE_CARDS.filter(
          (c) => c.trigger(s) && !(c.once && s.resolvedChoiceIds.includes(c.id)),
        );
        if (!eligible.length) return;
        if (Math.random() > 0.16) return;
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
        const flags = { ...s.flags, [`used:${tool}`]: true };

        // Combo detection.
        const { hit, mem } = detectCombo(tool, s, comboMemory);
        comboMemory = mem;
        let recentCombo = s.recentCombo;
        if (hit) {
          flags[hit.flag] = true;
          recentCombo = { kind: hit.kind, ts: Date.now() };
        }

        const patch: Partial<WorldState> = {
          effects,
          flags,
          lastToolEvent: { kind: tool, ts: Date.now() },
          recentCombo,
        };

        // Intro: each correct tap is BIG and advances the next step.
        const introBoost = s.intro !== "done";

        if (tool === "rain") {
          patch.water = clamp(s.water + (introBoost ? 0.5 : 0.06));
          patch.weather = "rain";
          patch.life = clamp(s.life + 0.004);
        } else if (tool === "sun") {
          patch.warmth = clamp(s.warmth + (introBoost ? 0.55 : 0.06));
          patch.weather = "clear";
          patch.life = clamp(s.life + 0.003);
        } else if (tool === "wind") {
          patch.weather = "clear";
          patch.life = clamp(s.life + 0.002);
        } else if (tool === "seed") {
          patch.life = clamp(s.life + (introBoost ? 0.06 : 0.03));
        }

        // Combo aftermath.
        if (hit?.kind === "bloom") {
          patch.life = clamp((patch.life ?? s.life) + 0.04);
        } else if (hit?.kind === "drought") {
          patch.life = clamp((patch.life ?? s.life) - 0.03);
          patch.water = clamp(s.water - 0.15);
        } else if (hit?.kind === "steam") {
          patch.weather = "aurora";
        }

        // Intro advancement: tool flow is warm (sun) → spray (rain) → seed → name.
        if (s.intro === "warm" && tool === "sun") {
          patch.intro = "spray";
          patch.selectedTool = "rain";
        } else if (s.intro === "spray" && tool === "rain") {
          patch.intro = "seed";
          patch.selectedTool = "seed";
        } else if (s.intro === "seed" && tool === "seed") {
          // Let them tap a few times. Advance once life has visibly grown.
          const nextLife = patch.life ?? s.life;
          if (nextLife >= 0.18) {
            patch.intro = "name";
            patch.selectedTool = null;
          }
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

      setSpeed: (speed) => set({ speed }),

      ackCuriosityToast: () => set({ lastUnlockedCuriosity: null }),

      markPivotFired: () => {
        const s = get();
        set({ pivotFired: true, flags: { ...s.flags, "pivot:fired": true } });
      },

      clearGlassMoment: () => set({ glassMomentAt: null }),

      clearRecentCombo: () => set({ recentCombo: null }),

      setComboFirstSeen: () => {
        const s = get();
        set({ flags: { ...s.flags, "combo:first-toast-seen": true } });
      },


      clearOfflineGap: () => set({ offlineGapMs: null }),

      touchLastSeen: () => set({ lastSeenAt: Date.now() }),

      followPerson: (pos) => {
        const s = get();
        // The first villager you ever follow is always Asha.
        const name = s.flags["asha:met"] ? randomMythicName() : "Asha";
        set({
          followed: { name, pos, adoptedAt: Date.now() },
          flags: { ...s.flags, "asha:met": true },
        });
      },

      unfollowPerson: () => set({ followed: null }),

      answerFollowedAddress: (answer) => {
        const s = get();
        if (!s.followed) return;
        const traits = { ...s.traits };
        const patch: Partial<WorldState> = {
          followed: { ...s.followed, pendingAddress: false },
          flags: { ...s.flags, "followed:addressed": true },
        };
        if (answer === "star") {
          traits.faith = clamp(traits.faith + 0.08);
          patch.traits = traits;
          patch.weather = "aurora";
        } else {
          traits.harmony = clamp(traits.harmony + 0.06);
          patch.traits = traits;
        }
        set(patch);
      },

      reset: () => {
        // Hard reset: wipe persisted state and reload so the renderer comes up
        // fresh in `intro: "gift"` with no stale R3F objects, choice cards, or
        // ambient audio holding the main thread.
        try {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("terrarium:v1");
            window.location.reload();
            return;
          }
        } catch {
          // fall through to in-memory reset
        }
        set(coldGenesisPatch());
      },
    }),
    {
      name: "terrarium:v1",
      version: 4,
      migrate: (persisted: unknown, _version: number) => {
        const p = (persisted ?? {}) as Partial<WorldState>;
        if (shouldForceColdGenesis(p)) {
          return coldGenesisPatch(p.seed) as WorldState;
        }
        let intro = p.intro;
        // Legacy "pour" was a removed jar step. Send those saves to the naming
        // beat so they still get the final genesis moment, not straight to done.
        if (intro === "pour") intro = "name";
        if (!intro || !VALID_INTROS.has(intro)) intro = "gift";
        return {
          ...p,
          intro,
          speed: p.speed ?? 1,
          unlockedCuriosityIds: p.unlockedCuriosityIds ?? [],
          playMs: p.playMs ?? 0,
          pivotFired: p.pivotFired ?? false,
          lastSeenAt: p.lastSeenAt ?? null,
          followed: p.followed ?? null,
        } as WorldState;
      },
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
        audioOn: s.audioOn,
        fifthFired: s.fifthFired,
        speed: s.speed,
        unlockedCuriosityIds: s.unlockedCuriosityIds,
        playMs: s.playMs,
        pivotFired: s.pivotFired,
        lastSeenAt: s.lastSeenAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (shouldForceColdGenesis(state)) {
          const cold = coldGenesisPatch(state.seed);
          Object.assign(state, cold, { session: (state.session ?? 0) + 1 });
          return;
        }
        state.session = (state.session ?? 0) + 1;
        state.activeChoiceId = null;
        // Compute offline gap if we have a prior visit and the world is alive.
        const last = state.lastSeenAt;
        if (last && state.intro === "done") {
          const gap = Date.now() - last;
          if (gap > 5 * 60_000) {
            state.offlineGapMs = gap;
          }
        }
        state.lastSeenAt = Date.now();
      },
    },
  ),
);

// Dev/test hook: expose the store on window so the automated genesis check
// (see /tmp/browser/genesis-check) can drive tool taps without raycasting
// through the WebGL canvas.
if (typeof window !== "undefined") {
  (window as unknown as { __terrarium: typeof useWorld }).__terrarium = useWorld;
}


export function lifeLabel(life: number): string {
  if (life < 0.05) return "a quiet seed";
  if (life < 0.2) return "a stirring world";
  if (life < 0.45) return "a small civilization";
  if (life < 0.7) return "a thriving world";
  if (life < 0.9) return "a humming world";
  return "a world of many lights";
}
