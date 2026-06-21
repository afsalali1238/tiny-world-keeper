// Combo detection. Called from store on tool use.
// Returns a combo kind if one fires this gesture, else null.

import type { ToolKind, WorldState } from "./types";

export type ComboKind = "steam" | "bloom" | "drought" | "exodus";

export interface ComboHit {
  kind: ComboKind;
  flag: string;
  mythLine?: string;
}

// State the store maintains between gestures.
export interface ComboMemory {
  lastTool: ToolKind | null;
  lastToolTs: number;
  sunStreak: { count: number; lastTs: number };
}

export const initialComboMemory: ComboMemory = {
  lastTool: null,
  lastToolTs: 0,
  sunStreak: { count: 0, lastTs: 0 },
};

export function detectCombo(
  tool: ToolKind,
  state: WorldState,
  mem: ComboMemory,
): { hit: ComboHit | null; mem: ComboMemory } {
  const now = Date.now();
  const next: ComboMemory = { ...mem, lastTool: tool, lastToolTs: now };

  // Sun streak.
  if (tool === "sun") {
    if (now - mem.sunStreak.lastTs < 8000) {
      next.sunStreak = { count: mem.sunStreak.count + 1, lastTs: now };
    } else {
      next.sunStreak = { count: 1, lastTs: now };
    }
  } else {
    next.sunStreak = mem.sunStreak;
  }

  // Steam: rain on a warm world.
  if (tool === "rain" && state.warmth > 0.55) {
    return { hit: { kind: "steam", flag: "combo:steam" }, mem: next };
  }

  // Bloom: seed when world is wet AND warm.
  if (tool === "seed" && state.water > 0.45 && state.warmth > 0.4) {
    return { hit: { kind: "bloom", flag: "combo:bloom" }, mem: next };
  }

  // Drought: three suns within ~12s.
  if (tool === "sun" && next.sunStreak.count >= 3) {
    next.sunStreak = { count: 0, lastTs: 0 };
    return { hit: { kind: "drought", flag: "combo:drought" }, mem: next };
  }

  // Exodus: wind right after seed (within 5s).
  if (tool === "wind" && mem.lastTool === "seed" && now - mem.lastToolTs < 5000) {
    return { hit: { kind: "exodus", flag: "combo:exodus" }, mem: next };
  }

  return { hit: null, mem: next };
}
