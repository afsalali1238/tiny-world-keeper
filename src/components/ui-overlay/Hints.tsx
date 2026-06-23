import { useEffect, useState } from "react";
import { useWorld } from "@/game/store";

const STORAGE_KEY = "terrarium:hints-seen";

interface Hint {
  id: string;
  text: string;
  position: string; // tailwind classes for absolute positioning
  delayMs: number;
  show: (s: ReturnType<typeof useWorld.getState>) => boolean;
}

const HINTS: Hint[] = [
  {
    id: "tools",
    text: "pick up a gesture, then touch the world",
    position: "bottom-24 left-1/2 -translate-x-1/2",
    delayMs: 3500,
    show: (s) => s.intro === "done" && !s.selectedTool,
  },
  {
    id: "speed",
    text: "time has a dial",
    position: "top-32 right-16",
    delayMs: 30_000,
    show: (s) => s.intro === "done" && s.speed === 1,
  },
  {
    id: "follow",
    text: "drop your tool, then tap the world to follow a small life",
    position: "bottom-24 left-1/2 -translate-x-1/2",
    delayMs: 45_000,
    show: (s) =>
      s.intro === "done" && !s.followed && !s.selectedTool && s.life > 0.15,
  },
  {
    id: "curiosities",
    text: "things you have noticed live here",
    position: "bottom-16 left-5",
    delayMs: 800,
    show: (s) => s.intro === "done" && s.unlockedCuriosityIds.length >= 1,
  },

];

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function markSeen(id: string) {
  try {
    const list = Array.from(loadSeen());
    if (!list.includes(id)) list.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function Hints() {
  const [seen, setSeen] = useState<Set<string>>(loadSeen);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const intro = useWorld((s) => s.intro);

  useEffect(() => {
    if (intro !== "done") return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    HINTS.forEach((h) => {
      if (seen.has(h.id)) return;
      timers.push(
        setTimeout(() => {
          const s = useWorld.getState();
          if (!h.show(s)) return;
          setVisible((v) => ({ ...v, [h.id]: true }));
          // auto-dismiss after 6s
          timers.push(
            setTimeout(() => {
              setVisible((v) => ({ ...v, [h.id]: false }));
              markSeen(h.id);
              setSeen((prev) => new Set(prev).add(h.id));
            }, 6000),
          );
        }, h.delayMs),
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [intro, seen]);

  if (intro !== "done") return null;

  return (
    <>
      {HINTS.map((h) =>
        visible[h.id] ? (
          <div
            key={h.id}
            className={"pointer-events-none absolute z-30 " + h.position}
          >
            <p className="terrarium-rise font-serif text-xs italic text-foreground/65 bg-card/70 px-2.5 py-1 rounded-full backdrop-blur shadow-sm whitespace-nowrap">
              {h.text}
            </p>
          </div>
        ) : null,
      )}
    </>
  );
}
