import { useEffect, useState } from "react";
import { useWorld } from "@/game/store";

const KEY = "terrarium:howto-seen";

export function useHowToPlay() {
  const intro = useWorld((s) => s.intro);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (intro !== "done") return;
    try {
      if (!localStorage.getItem(KEY)) {
        const t = setTimeout(() => setOpen(true), 900);
        return () => clearTimeout(t);
      }
    } catch {
      // ignore
    }
  }, [intro]);

  const close = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  };

  return { open, openIt: () => setOpen(true), close };
}

export function HowToPlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 grid place-items-center bg-background/55 px-5 backdrop-blur-md">
      <div className="terrarium-rise w-[min(560px,94vw)] max-h-[88vh] overflow-y-auto rounded-2xl bg-card/95 p-7 shadow-2xl">
        <p className="font-serif text-[10px] uppercase tracking-[0.32em] text-foreground/45">
          a quiet guide
        </p>
        <h2 className="mt-1 font-serif text-2xl italic text-foreground">
          What is The Terrarium?
        </h2>
        <p className="mt-3 font-serif text-sm leading-relaxed italic text-foreground/80">
          You are a Keeper. In your hands is a small living world. There is no
          score, no enemy, no ending. Watch it. Tend it. The people inside will
          never know you, but they will be shaped by what you do.
        </p>

        <Section title="How to tend it">
          <ul className="mt-2 space-y-2 font-serif text-sm italic text-foreground/80">
            <li>
              <b className="not-italic font-medium text-foreground">Rotate</b> &mdash;
              drag the world to look around.
            </li>
            <li>
              <b className="not-italic font-medium text-foreground">Pick a tool</b> from
              the dock at the bottom: rain, sun, wind, or seed.
            </li>
            <li>
              <b className="not-italic font-medium text-foreground">Tap the land</b> to
              apply it. Try two tools in a row &mdash; some pairs do something
              special.
            </li>
            <li>
              <b className="not-italic font-medium text-foreground">Wait</b>. Time passes
              faster here than it should. Use the speed dial if you grow
              impatient.
            </li>
          </ul>
        </Section>

        <Section title="What to watch for">
          <ul className="mt-2 space-y-2 font-serif text-sm italic text-foreground/80">
            <li>
              Small lights on the night side &mdash; settlements. They grow
              between glances.
            </li>
            <li>
              The narrator at the bottom &mdash; she is reading the world to you.
            </li>
            <li>
              Choices that surface from time to time &mdash; gentle moral
              questions. There are no wrong answers.
            </li>
            <li>
              The Curiosities panel (the dot, top right) &mdash; small things to
              notice. Find them at your own pace.
            </li>
          </ul>
        </Section>

        <p className="mt-5 font-serif text-xs italic text-foreground/55">
          Close this whenever you like. Tap the <b className="not-italic">?</b> in the
          corner to read it again.
        </p>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition hover:scale-[1.02]"
        >
          Begin tending
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="font-serif text-[10px] uppercase tracking-[0.28em] text-foreground/45">
        {title}
      </p>
      {children}
    </div>
  );
}
