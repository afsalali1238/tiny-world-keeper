// Curiosities: soft objectives. Silent unlocks. No score. No fail state.
// Each entry has a public label and a private "hint" shown only after it unlocks.
// The check runs on every tick once intro is done.

import type { WorldState } from "./types";

export interface Curiosity {
  id: string;
  label: string;
  hint: string; // revealed after unlock
  tier?: 1 | 2;
  check: (s: WorldState) => boolean;
}


export const CURIOSITIES: Curiosity[] = [
  {
    id: "first-rain",
    label: "Send the first rain",
    hint: "The first weather you ever made.",
    check: (s) => !!s.flags["used:rain"] || s.weather === "rain",
  },
  {
    id: "first-seed",
    label: "Plant a green thing",
    hint: "Something will grow from this. Not today.",
    check: (s) => !!s.flags["used:seed"],
  },
  {
    id: "first-sun",
    label: "Warm a cold place",
    hint: "Heat where there was none.",
    check: (s) => !!s.flags["used:sun"],
  },
  {
    id: "first-wind",
    label: "Move the weather",
    hint: "A breeze, then quiet again.",
    check: (s) => !!s.flags["used:wind"],
  },
  {
    id: "all-four",
    label: "Use every gesture",
    hint: "Rain. Sun. Wind. Seed. A small grammar.",
    check: (s) =>
      !!s.flags["used:rain"] &&
      !!s.flags["used:sun"] &&
      !!s.flags["used:wind"] &&
      !!s.flags["used:seed"],
  },
  {
    id: "second-age",
    label: "Witness the second age",
    hint: "An age ends. The next has already begun.",
    check: (s) => s.era >= 1,
  },
  {
    id: "civilisation",
    label: "Watch a civilisation arrive",
    hint: "Settlements, in the sense that any of this is settlement.",
    check: (s) => s.life >= 0.45,
  },
  {
    id: "humming-world",
    label: "A humming world",
    hint: "More lights than you can count from this height.",
    check: (s) => s.life >= 0.75,
  },
  {
    id: "named-it",
    label: "Name the world",
    hint: "It had to be called something.",
    check: (s) => s.planetName.trim().length > 0,
  },
  {
    id: "first-myth",
    label: "Hear them tell their first story",
    hint: "They have begun to explain themselves to themselves.",
    check: (s) => s.myths.length >= 1,
  },
  {
    id: "five-myths",
    label: "Collect five stories",
    hint: "A small library, written in firelight.",
    check: (s) => s.myths.length >= 5,
  },
  {
    id: "first-choice",
    label: "Answer one of their questions",
    hint: "A small decision. Felt for generations.",
    check: (s) => s.resolvedChoiceIds.length >= 1,
  },
  {
    id: "untouched-minute",
    label: "Let a generation pass untouched",
    hint: "Sometimes the kindest thing is to do nothing.",
    check: (s) =>
      s.ticks > 60 && (!s.lastToolEvent || Date.now() - s.lastToolEvent.ts > 90_000),
  },
  {
    id: "faith-rises",
    label: "See them invent a god",
    hint: "Faith, once it begins, is hard to undo.",
    check: (s) => s.traits.faith >= 0.4,
  },
  {
    id: "curiosity-rises",
    label: "See them invent a question",
    hint: "Curiosity, once it begins, is hard to undo.",
    check: (s) => s.traits.curiosity >= 0.4,
  },
  {
    id: "harmony-rises",
    label: "Hear them sing together",
    hint: "Harmony. Not for any reason. Just to do it.",
    check: (s) => s.traits.harmony >= 0.4,
  },
  {
    id: "rain-on-fire",
    label: "Make steam",
    hint: "Two of your gestures, working with each other.",
    check: (s) => !!s.flags["combo:steam"],
  },
  {
    id: "combo-bloom",
    label: "Coax a bloom",
    hint: "Water, warmth, a seed. The oldest recipe.",
    check: (s) => !!s.flags["combo:bloom"],
  },
  {
    id: "combo-drought",
    label: "Push the world too far",
    hint: "Three suns. The wells go quiet.",
    check: (s) => !!s.flags["combo:drought"],
  },
  {
    id: "combo-exodus",
    label: "Start a migration",
    hint: "A seed, then a wind to carry it.",
    check: (s) => !!s.flags["combo:exodus"],
  },
  {
    id: "watcher",
    label: "Feel watched",
    hint: "One of them looks up.",
    check: (s) => !!s.flags["pivot:fired"],
  },
  {
    id: "the-glass",
    label: "See the glass",
    hint: "For a moment, the world looks like an object.",
    check: (s) => !!s.flags["glass:seen"],
  },
  {
    id: "return",
    label: "Come back to them",
    hint: "Time passed while you were gone.",
    check: (s) => s.session >= 2,
  },
];

export const CURIOSITY_BY_ID: Record<string, Curiosity> = Object.fromEntries(
  CURIOSITIES.map((c) => [c.id, c]),
);
