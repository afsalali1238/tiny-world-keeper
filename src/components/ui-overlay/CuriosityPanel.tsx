import { useEffect, useState } from "react";
import { useWorld } from "@/game/store";
import { CURIOSITIES, CURIOSITY_BY_ID } from "@/game/curiosities";

export function CuriosityToast() {
  const last = useWorld((s) => s.lastUnlockedCuriosity);
  const ack = useWorld((s) => s.ackCuriosityToast);
  useEffect(() => {
    if (!last) return;
    const t = setTimeout(() => ack(), 4500);
    return () => clearTimeout(t);
  }, [last, ack]);
  if (!last) return null;
  const c = CURIOSITY_BY_ID[last.id];
  if (!c) return null;
  return (
    <div className="pointer-events-none absolute right-3 z-30 max-w-[16rem] sm:max-w-[18rem] sm:right-5 md:bottom-28 md:right-6 md:top-auto safe-offset-top safe-right md:[--safe-top-base:auto] [--safe-top-base:6rem]">
      <div className="terrarium-rise rounded-2xl bg-card/90 px-4 py-3 backdrop-blur shadow-sm">
        <p className="font-serif text-[10px] uppercase tracking-[0.28em] text-foreground/45">
          ✦  a curiosity recorded
        </p>
        <p className="mt-1 font-serif text-sm italic text-foreground/85">{c.label}</p>
        <p className="mt-0.5 font-serif text-xs text-foreground/55">{c.hint}</p>
      </div>
    </div>
  );
}

export function CuriosityPanel() {
  const intro = useWorld((s) => s.intro);
  const unlocked = useWorld((s) => s.unlockedCuriosityIds);
  const [open, setOpen] = useState(false);
  if (intro !== "done") return null;

  const unlockedSet = new Set(unlocked);
  const tier1 = CURIOSITIES.filter((c) => (c.tier ?? 1) === 1);
  const tier2 = CURIOSITIES.filter((c) => c.tier === 2);
  const tier1Complete = tier1.every((c) => unlockedSet.has(c.id));
  const hasUnseen = !!useWorld((s) => s.lastUnlockedCuriosity);


  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="curiosities"
        aria-label="curiosities"
        className="pointer-events-auto absolute left-5 bottom-5 z-20 inline-grid h-9 w-9 place-items-center rounded-full bg-card/80 backdrop-blur shadow-sm hover:bg-card"
      >
        <span className="font-serif text-base italic text-foreground/70">✦</span>
        {hasUnseen && (
          <span className="terrarium-pulse absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
        )}
      </button>


      {open && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-ink/30 backdrop-blur-sm p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="terrarium-rise max-h-[80vh] w-full max-w-md overflow-y-auto rounded-3xl bg-card/95 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-baseline justify-between">
              <div>
                <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-foreground/45">
                  the keeper's notebook
                </p>
                <p className="font-serif text-xl italic text-foreground/85">curiosities</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="font-serif text-xs italic text-foreground/55 hover:text-foreground"
              >
                close
              </button>
            </div>

            <ul className="space-y-2.5">
              {tier1.map((c) => {
                const got = unlockedSet.has(c.id);
                return (
                  <li
                    key={c.id}
                    className={
                      "rounded-2xl px-3 py-2 transition " +
                      (got ? "bg-secondary/70" : "bg-secondary/20")
                    }
                  >
                    <p className={"font-serif text-sm " + (got ? "italic text-foreground/85" : "text-foreground/45")}>
                      {got ? c.label : "· · ·"}
                    </p>
                    {got && (
                      <p className="mt-0.5 font-serif text-xs text-foreground/60">{c.hint}</p>
                    )}
                  </li>
                );
              })}
            </ul>

            {tier1Complete && (
              <>
                <div className="my-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-foreground/15" />
                  <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-foreground/45">
                    deeper noticings
                  </span>
                  <span className="h-px flex-1 bg-foreground/15" />
                </div>
                <ul className="space-y-2.5">
                  {tier2.map((c) => {
                    const got = unlockedSet.has(c.id);
                    return (
                      <li
                        key={c.id}
                        className={
                          "rounded-2xl px-3 py-2 transition " +
                          (got ? "bg-secondary/70" : "bg-secondary/20")
                        }
                      >
                        <p className={"font-serif text-sm " + (got ? "italic text-foreground/85" : "text-foreground/45")}>
                          {got ? c.label : "· · ·"}
                        </p>
                        {got && (
                          <p className="mt-0.5 font-serif text-xs text-foreground/60">{c.hint}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}


            <p className="mt-5 text-center font-serif text-[11px] italic text-foreground/45">
              there is no winning. only noticing.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
