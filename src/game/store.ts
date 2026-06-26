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
  unlockedTools: ["sun", "rain", "wind", "seed"],
  unlockedPassives: [],
  blightNodes: [],
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
  pendingConsequences: [],
  followed: null,
});

const initialWorld = createInitialWorld();

const VALID_INTROS = new Set<WorldState["intro"]>(["gift", "warm", "spray", "seed", "name", "done", "transcend"]);

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
        if (tickAccumulator < 0.85) {
          // still bump playMs lightly for sub-tick accumulation
          return;
        }
        const accumulated = tickAccumulator;
        tickAccumulator = 0;

        const ticks = s.ticks + 1;
        
        // Belief Modifiers
        let lifeGrowth = 0.0025;
        let tempoMult = 1.0;
        let faithRegen = 0.001;

        if (s.traits.fear > 0.6) lifeGrowth *= 0.5;
        if (s.traits.harmony > 0.6) lifeGrowth *= 1.5;
        if (s.traits.curiosity > 0.6) tempoMult = 1.25;
        
        if (s.life > 0.1) {
          faithRegen += (s.traits.faith > 0.5 ? 0.002 : 0);
        }

        // Wait, unused local life was here
        const traits = {
          ...s.traits,
          faith: clamp(s.traits.faith + faithRegen),
        };

        let era = s.era;
        let acc = 0;
        let isReckoning = false;
        
        for (let i = 0; i < ERAS.length; i++) {
          acc += (ERAS[i].durationTicks / tempoMult);
          if (ticks < acc) {
            era = i;
            if (ERAS[i].name === "The Reckoning") isReckoning = true;
            break;
          }
          era = i;
        }
        
        let nextIntro = s.intro;
        let finalWarmth = s.warmth;
        let finalWater = s.water;
        
        // The Reckoning Engine
        if (isReckoning) {
          // Push warmth and water away from 0.5
          finalWarmth = clamp(s.warmth + (s.warmth >= 0.5 ? 0.005 : -0.005));
          finalWater = clamp(s.water + (s.water >= 0.5 ? 0.005 : -0.005));
          
          // Life drains quickly if conditions are harsh
          if (Math.abs(finalWarmth - 0.5) > 0.3 || Math.abs(finalWater - 0.5) > 0.3) {
             lifeGrowth -= 0.01;
          }
        }
        
        let finalLife = clamp(s.life + lifeGrowth);
        
        // Endings
        if (isReckoning && finalLife <= 0) {
           // Collapse
           // nextIntro stays "done" but life is 0.
        } else if (era === ERAS.length - 1 && ticks >= acc && finalLife > 0) {
           // Survived the final era!
           finalLife = 1.0; 
           
           if (s.traits.fear > 0.7 && s.traits.curiosity > 0.5) {
             nextIntro = "escape"; // New ending!
           } else {
             nextIntro = "transcend";
           }
        }
        
        // Blight Logic
        let nextBlightNodes = [...(s.blightNodes || [])];
        if (era >= 2 && Math.random() < 0.01 && nextBlightNodes.length < 5) {
          // Spawn new blight
          const pos: [number, number, number] = [
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20
          ];
          nextBlightNodes.push({ id: Math.random(), pos, size: 0.1, bornAt: Date.now() });
        }
        
        let blightDrain = 0;
        nextBlightNodes = nextBlightNodes.map(n => {
          const size = Math.min(1.0, n.size + 0.002);
          blightDrain += size * 0.0005;
          return { ...n, size };
        });
        
        if (nextBlightNodes.length >= 5 && nextBlightNodes.every(n => n.size > 0.8)) {
           // Corruption loss
           finalLife = 0;
           nextIntro = "corruption";
        }
        
        let finalLifeWithBlight = clamp(finalLife - blightDrain);

        // Automatic Era Unlocks
        let unlockedTools = [...(s.unlockedTools || ["sun", "rain", "wind", "seed"])];
        if (era >= 2 && !unlockedTools.includes("lightning")) unlockedTools.push("lightning");
        if (era >= 4 && !unlockedTools.includes("aegis")) unlockedTools.push("aegis");
        
        const ageName = ageNameForEra(era);

        let weather = s.weather;
        if (weather && weather !== "clear" && Math.random() < 0.01) weather = "clear";

        let patch: Partial<WorldState> = {
          ticks,
          life: finalLifeWithBlight,
          warmth: finalWarmth,
          water: finalWater,
          intro: nextIntro,
          blightNodes: nextBlightNodes,
          unlockedTools,
          traits,
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
        
        // Process pending consequences first
        const dueConsequence = s.pendingConsequences.find((c) => c.tick <= s.ticks);
        if (dueConsequence) {
          set({
            activeChoiceId: dueConsequence.dilemmaId,
            pendingConsequences: s.pendingConsequences.filter((c) => c !== dueConsequence),
          });
          return;
        }

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
        let pendingConsequences = [...s.pendingConsequences];
        
        if (hit) {
          flags[hit.flag] = true;
          recentCombo = { kind: hit.kind, ts: Date.now() };
          
          // Systemic Echoes: Delay a consequence for the combo
          if (hit.kind === "drought") {
            pendingConsequences.push({ tick: s.ticks + 35, dilemmaId: "dilemma_heatwave" });
          } else if (hit.kind === "steam") {
            pendingConsequences.push({ tick: s.ticks + 25, dilemmaId: "dilemma_flood" });
          }
        }

        const patch: Partial<WorldState> = {
          effects,
          flags,
          lastToolEvent: { kind: tool, ts: Date.now() },
          recentCombo,
          pendingConsequences,
        };

        // Intro: each correct tap is BIG and advances the next step.
        const introBoost = s.intro !== "done";

        // Faith cost & weakness
        let powerMult = 1.0;
        if (!introBoost) {
          patch.traits = { ...s.traits, faith: clamp(s.traits.faith - 0.05) };
          if (s.traits.faith < 0.15) {
            powerMult = 0.5;
          }
        }

        if (tool === "rain") {
          patch.water = clamp(s.water + (introBoost ? 0.5 : 0.06 * powerMult));
          patch.weather = "rain";
          patch.life = clamp(s.life + 0.004 * powerMult);
        } else if (tool === "sun") {
          patch.warmth = clamp(s.warmth + (introBoost ? 0.55 : 0.06 * powerMult));
          patch.weather = "clear";
          patch.life = clamp(s.life + 0.003 * powerMult);
        } else if (tool === "wind") {
          patch.weather = "clear";
          patch.life = clamp(s.life + 0.002 * powerMult);
        } else if (tool === "seed") {
          patch.life = clamp(s.life + (introBoost ? 0.06 : 0.03 * powerMult));
        } else if (tool === "lightning") {
          patch.weather = "storm";
          // Lightning damages/destroys blight
          if (s.blightNodes && s.blightNodes.length > 0) {
            patch.blightNodes = s.blightNodes.map(node => {
               // Distance check roughly based on positions, but for simplicity, strike a random one if close, or just strike the largest
               return { ...node, size: Math.max(0, node.size - 0.4 * powerMult) };
            }).filter(n => n.size > 0);
          }
        } else if (tool === "aegis") {
          patch.flags = { ...s.flags, "aegis_active": true };
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
        // Hard reset: navigate to ?fresh=1 so the pre-hydrate wipe runs and
        // the renderer comes up clean. We use location.replace (not reload)
        // so pending fetches / AudioContexts / R3F render loops don't have
        // to gracefully tear down on the current page — the navigation just
        // discards them. This avoids the ~45s reload hang we saw before.
        try {
          if (typeof window !== "undefined") {
            // Best-effort: silence audio so the new page boots quiet.
            try { (window as unknown as { __terrariumAudio?: { suspend?: () => void } }).__terrariumAudio?.suspend?.(); } catch { /* noop */ }
            window.localStorage.removeItem("terrarium:v1");
            const url = window.location.pathname + "?fresh=1" + window.location.hash;
            window.location.replace(url);
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
          pendingConsequences: p.pendingConsequences ?? [],
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
        pendingConsequences: s.pendingConsequences,
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
