import { useWorld, lifeLabel } from "@/game/store";

export function EraRibbon() {
  const ageName = useWorld((s) => s.ageName);
  const planetName = useWorld((s) => s.planetName);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center pt-3 px-3">
      <div className="flex max-w-[88vw] flex-col items-center rounded-full bg-card/85 px-5 py-2 text-center shadow-md backdrop-blur-md">
        <p className="font-serif text-[10px] uppercase tracking-[0.32em] text-foreground/55 truncate max-w-full">
          {planetName}
        </p>
        <p className="font-serif text-base italic leading-tight text-foreground/90 md:text-lg truncate max-w-full">
          {ageName}
        </p>
      </div>
    </div>
  );
}

export function LivingPulse() {
  const life = useWorld((s) => s.life);
  const label = lifeLabel(life);
  return (
    <div className="pointer-events-none absolute left-5 top-16 z-20 flex items-center gap-2.5">
      <span className="terrarium-pulse h-2.5 w-2.5 rounded-full bg-accent" />
      <span className="font-serif text-xs italic text-foreground/75">{label}</span>
    </div>
  );
}

export function MenuCorner({ onHelp }: { onHelp?: () => void } = {}) {
  const audioOn = useWorld((s) => s.audioOn);
  const setAudio = useWorld((s) => s.setAudio);
  const reset = useWorld((s) => s.reset);
  const onReset = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm("Begin a new world? This world and its keeper will be lost.")
    ) {
      reset();
    }
  };
  return (
    <div className="absolute right-5 top-5 z-20 flex items-center gap-2">
      <button
        title="Begin a new world"
        onClick={onReset}
        className="grid h-9 w-9 place-items-center rounded-full bg-card/60 font-serif text-sm italic text-foreground/70 backdrop-blur transition hover:bg-card/90"
        aria-label="Begin a new world"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>
      </button>
      {onHelp && (
        <button
          title="How to play"
          onClick={onHelp}
          className="grid h-9 w-9 place-items-center rounded-full bg-card/60 font-serif text-sm italic text-foreground/70 backdrop-blur transition hover:bg-card/90"
        >
          ?
        </button>
      )}
      <button
        title={audioOn ? "Narrator voice on" : "Narrator voice off"}
        onClick={() => setAudio(!audioOn)}
        className={
          "grid h-9 w-9 place-items-center rounded-full backdrop-blur transition " +
          (audioOn
            ? "bg-accent text-accent-foreground"
            : "bg-card/60 text-foreground/60 hover:bg-card/90")
        }
      >
        {audioOn ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>
        )}
      </button>
    </div>
  );
}
