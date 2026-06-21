import { useWorld, lifeLabel } from "@/game/store";

export function EraRibbon() {
  const ageName = useWorld((s) => s.ageName);
  const planetName = useWorld((s) => s.planetName);
  return (
    <div className="pointer-events-none absolute left-1/2 top-6 z-20 -translate-x-1/2 text-center">
      <p className="font-serif text-xs uppercase tracking-[0.3em] text-foreground/50">
        {planetName}
      </p>
      <p className="font-serif text-lg italic text-foreground/85 md:text-xl">{ageName}</p>
    </div>
  );
}

export function LivingPulse() {
  const life = useWorld((s) => s.life);
  const label = lifeLabel(life);
  return (
    <div className="pointer-events-none absolute left-6 top-6 z-20 flex items-center gap-2.5">
      <span className="terrarium-pulse h-2.5 w-2.5 rounded-full bg-accent" />
      <span className="font-serif text-sm italic text-foreground/75">{label}</span>
    </div>
  );
}

export function MenuCorner() {
  const audioOn = useWorld((s) => s.audioOn);
  const setAudio = useWorld((s) => s.setAudio);
  return (
    <div className="absolute right-5 top-5 z-20 flex items-center gap-2">
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
