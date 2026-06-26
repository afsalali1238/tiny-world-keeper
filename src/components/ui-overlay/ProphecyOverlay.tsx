import { useEffect, useState, useRef } from "react";
import { useWorld } from "@/game/store";
import { speakViaTTS } from "@/lib/tts";

export function ProphecyOverlay() {
  const pendingConsequences = useWorld((s) => s.pendingConsequences);
  const ticks = useWorld((s) => s.ticks);
  const intro = useWorld((s) => s.intro);
  
  if (intro !== "done") return null;

  // Check if any disaster is approaching within 60 ticks
  const imminent = pendingConsequences.find(c => c.tick > ticks && c.tick - ticks < 60);

  if (!imminent) return null;

  let text = "The world trembles...";
  if (imminent.dilemmaId === "dilemma_flood") text = "The air grows heavy. A great flood approaches.";
  if (imminent.dilemmaId === "dilemma_heatwave") text = "The sun beats down ruthlessly. A heatwave approaches.";

  const spokenRef = useRef<string | null>(null);
  useEffect(() => {
    if (text && spokenRef.current !== text) {
      spokenRef.current = text;
      const ac = new AbortController();
      speakViaTTS(text, ac.signal);
      return () => ac.abort();
    }
  }, [text]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-32 z-40 flex flex-col items-center gap-1 px-6 text-center transition-opacity duration-1000">
      <p className="terrarium-fade font-serif text-lg italic text-red-500/90 drop-shadow-md">
        {text}
      </p>
    </div>
  );
}
