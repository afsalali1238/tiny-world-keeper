import { useEffect, useMemo, useState } from "react";
import { useWorld } from "@/game/store";

const ROTATE_MS = 14_000;

function pickVignette(
  name: string,
  planet: string,
  era: number,
  weather: string | null,
  traits: { faith: number; curiosity: number; fear: number; harmony: number },
  tick: number,
): string {
  const pool: string[] = [];
  // weather-led
  if (weather === "rain") {
    pool.push(`${name} stands in a doorway and watches the rain darken the stones.`);
    pool.push(`${name} pulls a child indoors. The roof remembers how to be a roof.`);
  } else if (weather === "storm") {
    pool.push(`${name} ties down a shutter and counts to ten between flashes.`);
    pool.push(`${name} prays to whatever is listening. You are, in fact, listening.`);
  } else if (weather === "aurora") {
    pool.push(`${name} stares up. They will be quiet about it for the rest of the week.`);
  } else {
    pool.push(`${name} walks the long way home, because the light is good.`);
  }
  // era-led
  if (era <= 0) {
    pool.push(`${name} eats a piece of fruit they didn't know had a name yet.`);
  } else if (era === 1) {
    pool.push(`${name} carves a small mark into a beam — a year, a debt, a child.`);
  } else if (era === 2) {
    pool.push(`${name} reads a letter twice and folds it carefully into a pocket.`);
  } else {
    pool.push(`${name} watches the lights of a far city blink on, one by one.`);
  }
  // trait-led
  const topTrait = (Object.entries(traits) as [keyof typeof traits, number][])
    .sort((a, b) => b[1] - a[1])[0];
  if (topTrait && topTrait[1] > 0.2) {
    const [k] = topTrait;
    if (k === "faith") pool.push(`${name} leaves a small offering on a windowsill in ${planet}.`);
    if (k === "curiosity") pool.push(`${name} writes down a word for a thing they don't have a word for.`);
    if (k === "fear") pool.push(`${name} double-checks the door. Then a third time.`);
    if (k === "harmony") pool.push(`${name} shares a quiet meal with a neighbor. Neither speaks much.`);
  }
  // generic background
  pool.push(`${name} is somewhere in ${planet} today, doing something small.`);
  return pool[tick % pool.length];
}

export function FollowedCard() {
  const followed = useWorld((s) => s.followed);
  const unfollow = useWorld((s) => s.unfollowPerson);
  const planetName = useWorld((s) => s.planetName);
  const era = useWorld((s) => s.era);
  const weather = useWorld((s) => s.weather);
  const traits = useWorld((s) => s.traits);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!followed) return;
    const id = setInterval(() => setTick((t) => t + 1), ROTATE_MS);
    return () => clearInterval(id);
  }, [followed]);

  const line = useMemo(
    () =>
      followed
        ? pickVignette(followed.name, planetName || "the world", era, weather, traits, tick)
        : "",
    [followed, planetName, era, weather, traits, tick],
  );

  if (!followed) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-28 z-30 flex justify-center px-4">
      <div className="terrarium-rise pointer-events-auto flex max-w-md flex-col items-center gap-1 rounded-3xl bg-card/90 px-5 py-3 text-center shadow-md backdrop-blur-md">
        <p className="font-serif text-[10px] uppercase tracking-[0.32em] text-foreground/45">
          you are watching
        </p>
        <p className="font-serif text-lg italic text-foreground/90">{followed.name}</p>
        <p className="mt-1 font-serif text-sm italic leading-snug text-foreground/70">{line}</p>
        <button
          onClick={() => unfollow()}
          className="mt-2 rounded-full px-3 py-1 font-serif text-[11px] italic text-foreground/55 transition hover:bg-secondary/70 hover:text-foreground/85"
        >
          let them go
        </button>
      </div>
    </div>
  );
}
