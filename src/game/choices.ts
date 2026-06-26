import type { ChoiceCard } from "./types";

export const CHOICE_CARDS: ChoiceCard[] = [
  {
    id: "stars",
    once: true,
    prompt: "A village argues over what the stars are.",
    sub: "Settle it with…",
    options: [
      {
        label: "a comforting lie",
        effects: { faith: 0.1, harmony: 0.05 },
        mythId: "comfortingLie",
      },
      {
        label: "a frightening truth",
        effects: { curiosity: 0.12, fear: 0.08 },
        mythId: "frighteningTruth",
      },
    ],
    trigger: (w) => w.era >= 1,
  },
  {
    id: "twins",
    once: true,
    prompt: "Two children are born on the same night.",
    sub: "Bless…",
    options: [
      { label: "the firstborn", effects: { harmony: 0.05 }, mythId: "firstborn" },
      { label: "the quiet one", effects: { curiosity: 0.08 }, mythId: "quietOne" },
      { label: "neither", ghost: true, effects: { fear: 0.04 } },
    ],
    trigger: (w) => w.era >= 1,
  },
  {
    id: "mountain",
    once: true,
    prompt: "They have named a mountain after you.",
    sub: "Make it…",
    options: [
      { label: "bloom", effects: { harmony: 0.1 }, world: { life: 0.05 }, mythId: "bloomMountain" },
      { label: "smoke", effects: { fear: 0.12 }, mythId: "smokeMountain" },
      { label: "leave it", ghost: true },
    ],
    trigger: (w) => w.era >= 2,
  },
  {
    id: "drought",
    once: true,
    prompt: "A village is going thirsty.",
    sub: "You could…",
    options: [
      { label: "send the rain", world: { weather: "rain" }, effects: { faith: 0.1 }, mythId: "droughtMercy" },
      { label: "do nothing", ghost: true, effects: { harmony: -0.05, fear: 0.08 }, mythId: "withheld" },
    ],
    trigger: (w) => w.era >= 2,
  },
  {
    id: "prophets",
    once: true,
    prompt: "Two prophets walk the same road, speaking opposite words.",
    sub: "Favor…",
    options: [
      { label: "the elder", effects: { harmony: 0.1 }, mythId: "twoProphetsA" },
      { label: "the young", effects: { curiosity: 0.1, fear: 0.04 }, mythId: "twoProphetsB" },
    ],
    trigger: (w) => w.era >= 3,
  },
  {
    id: "festival",
    once: true,
    prompt: "A city is preparing its first festival.",
    sub: "Send…",
    options: [
      { label: "warm weather", world: { weather: "clear", warmth: 0.05 }, effects: { harmony: 0.08 } },
      { label: "a soft rain", world: { weather: "rain" }, effects: { faith: 0.05 }, mythId: "rainBlessing" },
      { label: "nothing at all", ghost: true, effects: { fear: 0.03 } },
    ],
    trigger: (w) => w.era >= 3,
  },
  {
    id: "name-the-world",
    once: true,
    prompt: "The cartographers are choosing what to call this world.",
    sub: "Whisper into their dreams…",
    options: [
      { label: "let them choose", ghost: true, effects: { curiosity: 0.05 } },
      { label: "give them your name", effects: { faith: 0.15, fear: 0.05 } },
    ],
    trigger: (w) => w.era >= 2,
  },
  {
    id: "comet",
    once: true,
    prompt: "Tonight the sky is unusually quiet.",
    sub: "You could…",
    options: [
      { label: "send a comet", effects: { faith: 0.1, fear: 0.06 }, mythId: "cometSign" },
      { label: "let it pass", ghost: true, mythId: "withheld" },
    ],
    trigger: (w) => w.era >= 3,
  },
  {
    id: "aurora",
    once: true,
    prompt: "The poles are humming tonight.",
    sub: "Pull a…",
    options: [
      { label: "ribbon of light", world: { weather: "aurora" }, effects: { harmony: 0.1, curiosity: 0.06 }, mythId: "auroraWonder" },
      { label: "deeper quiet", ghost: true, effects: { harmony: 0.04 } },
    ],
    trigger: (w) => w.era >= 4,
  },
  {
    id: "stormful",
    once: true,
    prompt: "A young captain prays for safe passage.",
    sub: "Answer with…",
    options: [
      { label: "still water", world: { weather: "clear" }, effects: { faith: 0.08 } },
      { label: "a teaching storm", world: { weather: "storm" }, effects: { fear: 0.1 } },
      { label: "silence", ghost: true, mythId: "withheld" },
    ],
    trigger: (w) => w.era >= 3,
  },
  {
    id: "dilemma_heatwave",
    once: true,
    prompt: "The rivers run dry. The heat you brought is suffocating them.",
    sub: "They beg for relief...",
    options: [
      { label: "send a deluge", world: { weather: "rain", water: 0.1 }, effects: { faith: -0.15, fear: 0.1 } },
      { label: "let them burn", ghost: true, world: { life: -0.05 }, effects: { fear: 0.2, harmony: -0.1 } },
    ],
    trigger: () => false, // Triggered manually via consequences
  },
  {
    id: "dilemma_flood",
    once: true,
    prompt: "The waters rise. Your rains have flooded the lowlands.",
    sub: "They scramble for higher ground...",
    options: [
      { label: "send the wind", world: { weather: "clear", water: -0.1 }, effects: { faith: -0.15, harmony: 0.1 } },
      { label: "watch them drown", ghost: true, world: { life: -0.05 }, effects: { fear: 0.2, faith: -0.1 } },
    ],
    trigger: () => false, // Triggered manually via consequences
  }
];
