import { useWorld } from "@/game/store";
import type { ToolKind } from "@/game/types";

const TOOLS: { kind: ToolKind; label: string; hint: string; icon: JSX.Element }[] = [
  {
    kind: "rain",
    label: "Rain",
    hint: "tap the land to send a small rain",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/><line x1="8" y1="19" x2="8" y2="21"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="16" y1="19" x2="16" y2="21"/></svg>
    ),
  },
  {
    kind: "sun",
    label: "Sun",
    hint: "tap to warm a place",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
    ),
  },
  {
    kind: "wind",
    label: "Wind",
    hint: "tap to send a breeze across",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 14h15a3 3 0 1 1-3 3"/><path d="M3 11h7"/></svg>
    ),
  },
  {
    kind: "seed",
    label: "Seed",
    hint: "tap the land to plant a little life",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12"/><path d="M12 12c-3 0-6-2-6-6 4 0 6 2 6 6z"/><path d="M12 12c3 0 6-2 6-6-4 0-6 2-6 6z"/></svg>
    ),
  },
];

export function ToolDock() {
  const intro = useWorld((s) => s.intro);
  const selectedTool = useWorld((s) => s.selectedTool);
  const setTool = useWorld((s) => s.setTool);
  if (intro !== "done") return null;

  const active = TOOLS.find((t) => t.kind === selectedTool);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex flex-col items-center gap-2">
      <p className="font-serif text-xs italic text-foreground/55 min-h-[1em]">
        {active ? active.hint : "pick up a tool, then touch the world"}
      </p>
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-card/85 px-2 py-2 backdrop-blur shadow-sm">
        {TOOLS.map((t) => {
          const isOn = selectedTool === t.kind;
          return (
            <button
              key={t.kind}
              title={t.label}
              onClick={() => setTool(isOn ? null : t.kind)}
              className={
                "grid h-11 w-11 place-items-center rounded-full transition " +
                (isOn
                  ? "bg-accent text-accent-foreground scale-110 shadow"
                  : "text-foreground/70 hover:bg-secondary/70")
              }
            >
              {t.icon}
            </button>
          );
        })}
      </div>
    </div>
  );
}
