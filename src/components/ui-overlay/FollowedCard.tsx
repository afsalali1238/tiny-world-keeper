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
    pool.push(`${name} carves a small mark into a beam (a year, a debt, a child).`);
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
  const answerAddress = useWorld((s) => s.answerFollowedAddress);
  const planetName = useWorld((s) => s.planetName);
  const era = useWorld((s) => s.era);
  const weather = useWorld((s) => s.weather);
  const traits = useWorld((s) => s.traits);
  const activeChoiceId = useWorld((s) => s.activeChoiceId);
  const [tick, setTick] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!followed) return;
    setExpanded(true);
    const collapse = setTimeout(() => setExpanded(false), 5000);
    return () => clearTimeout(collapse);
  }, [followed]);

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

  if (followed.pendingAddress) {
    return (
      <div className="pointer-events-auto absolute inset-x-0 bottom-24 z-40 flex justify-center px-4">
        <div className="terrarium-rise flex w-[min(440px,92vw)] flex-col items-center gap-3 rounded-3xl bg-card/95 p-5 text-center shadow-xl backdrop-blur-xl">
          <p className="font-serif text-[10px] uppercase tracking-[0.32em] text-foreground/45">
            {followed.name} is speaking to you
          </p>
          <p className="font-serif text-lg italic text-foreground/90">
            "If you are there, send a sign."
          </p>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => answerAddress("star")}
              className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:scale-[1.03]"
            >
              send a falling star
            </button>
            <button
              onClick={() => answerAddress("quiet")}
              className="rounded-full border border-border bg-background/40 px-4 py-2 font-serif text-sm italic text-foreground/70 transition hover:bg-background/80"
            >
              stay quiet
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showBody = expanded && !activeChoiceId;

  return (
    <div className="pointer-events-auto absolute left-4 top-28 z-30 max-w-[min(18rem,70vw)]">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-card/85 px-3 py-1.5 shadow-sm backdrop-blur-md transition hover:bg-card/95"
        title={showBody ? "hide" : "show what they're doing"}
      >
        <span className="terrarium-pulse h-2 w-2 rounded-full bg-accent" />
        <span className="font-serif text-[10px] uppercase tracking-[0.28em] text-foreground/50">
          watching
        </span>
        <span className="font-serif text-sm italic text-foreground/90">{followed.name}</span>
      </button>
      {showBody && (
        <div className="terrarium-rise mt-2 rounded-2xl bg-card/85 px-4 py-3 shadow-sm backdrop-blur-md">
          <p className="font-serif text-xs italic leading-snug text-foreground/75">{line}</p>
          <button
            onClick={() => unfollow()}
            className="mt-2 rounded-full px-2 py-0.5 font-serif text-[10px] italic text-foreground/50 transition hover:bg-secondary/70 hover:text-foreground/85"
          >
            let them go
          </button>
        </div>
      )}
    </div>
  );
}
