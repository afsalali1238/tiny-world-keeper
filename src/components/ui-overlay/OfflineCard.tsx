import { useMemo } from "react";
import { useWorld } from "@/game/store";

// 1 real minute ~= 8 in-world years. Cozy but legible.
const YEARS_PER_MIN = 8;

function beatFor(years: number, planetName: string): string {
  const name = planetName || "the world";
  if (years < 2) {
    return `A short while passed. The wind in ${name} kept its same direction. A bird returned to the same branch.`;
  }
  if (years < 12) {
    return `A handful of years passed in ${name}. A child you never met learned to walk, then to read.`;
  }
  if (years < 40) {
    return `A generation passed in ${name}. Someone was named after you, though they were told it was an old word for "the quiet."`;
  }
  if (years < 200) {
    return `Centuries passed in ${name}. The river moved. The capital moved with it. A book was written about a watcher in the sky. It is mostly correct.`;
  }
  return `An age passed in ${name}. The ruins of the old cities are studied by the new ones. They cannot agree on what the towers were for.`;
}

export function OfflineCard() {
  const gap = useWorld((s) => s.offlineGapMs);
  const clear = useWorld((s) => s.clearOfflineGap);
  const intro = useWorld((s) => s.intro);
  const planetName = useWorld((s) => s.planetName);

  const years = useMemo(() => {
    if (!gap) return 0;
    return Math.max(1, Math.round((gap / 60_000) * YEARS_PER_MIN));
  }, [gap]);

  if (intro !== "done" || !gap) return null;
  const text = beatFor(years, planetName);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-ink/55 p-6 backdrop-blur-sm">
      <div className="terrarium-rise max-w-md rounded-3xl bg-card/95 p-7 text-center shadow-xl">
        <p className="font-serif text-[10px] uppercase tracking-[0.32em] text-foreground/45">
          while you were away
        </p>
        <p className="mt-3 font-serif text-3xl italic text-foreground/90">
          {years} {years === 1 ? "year" : "years"}
        </p>
        <p className="mt-4 font-serif text-sm italic leading-relaxed text-foreground/75">
          {text}
        </p>
        <button
          onClick={() => clear()}
          className="mt-6 rounded-full bg-accent px-5 py-2 font-serif text-sm italic text-accent-foreground transition hover:opacity-90"
        >
          look in again
        </button>
      </div>
    </div>
  );
}
