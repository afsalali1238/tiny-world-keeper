import type { EraConfig } from "./types";

export const ERAS: EraConfig[] = [
  { name: "The Age of First Light", durationTicks: 40 },
  { name: "The Age of Stones", durationTicks: 60 },
  { name: "The Age of Myth", durationTicks: 80, guaranteed: ["creation"] },
  { name: "The Age of Hearths", durationTicks: 100 },
  { name: "The Age of Sails", durationTicks: 120 },
  { name: "The Age of Towers", durationTicks: 140 },
  { name: "The Long Age", durationTicks: 200 },
];

export function ageNameForEra(era: number): string {
  return ERAS[Math.min(era, ERAS.length - 1)].name;
}
