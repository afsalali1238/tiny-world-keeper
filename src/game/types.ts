export type Trait = "faith" | "curiosity" | "fear" | "harmony";
export type Weather = "clear" | "rain" | "storm" | "aurora" | null;
export type IntroStep = "gift" | "name" | "warm" | "water" | "life" | "done";
export type ToolKind = "rain" | "sun" | "wind" | "seed";

export interface TouchEffect {
  id: number;
  kind: ToolKind;
  pos: [number, number, number];
  bornAt: number;
}

export interface WorldState {
  planetName: string;
  seed: number;
  era: number;
  ageName: string;
  warmth: number; // 0..1
  water: number; // 0..1
  life: number; // 0..1
  traits: Record<Trait, number>;
  weather: Weather;
  flags: Record<string, boolean>;
  session: number;
  intro: IntroStep;
  ticks: number;
  myths: MythEntry[];
  activeChoiceId: string | null;
  resolvedChoiceIds: string[];
  firedMythIds: string[];
  selectedTool: ToolKind | null;
  effects: TouchEffect[];
  audioOn: boolean;
  currentNarration: { id: string; text: string; bornAt: number } | null;
  recentNarrationIds: string[];
  lastToolEvent: { kind: ToolKind; ts: number } | null;
  fifthFired: boolean;
}

export interface MythEntry {
  id: string;
  tag: string;
  text: string;
  era: number;
  createdAt: number;
}

export interface ChoiceOption {
  label: string;
  ghost?: boolean;
  effects?: Partial<Record<Trait, number>>;
  world?: Partial<Pick<WorldState, "weather" | "life" | "warmth" | "water">>;
  mythId?: string;
  setFlag?: string;
}

export interface ChoiceCard {
  id: string;
  prompt: string;
  sub?: string;
  options: ChoiceOption[];
  trigger: (w: WorldState) => boolean;
  once?: boolean;
  weight?: number;
}

export interface EraConfig {
  name: string;
  durationTicks: number;
  guaranteed?: string[];
}
